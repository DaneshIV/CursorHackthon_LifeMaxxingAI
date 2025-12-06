import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

const ANALYSIS_PROMPT = `You are AdultingOS, an AI document analyzer. Analyze the provided document text and extract key information to help the user understand and take action.

Provide your analysis in the following JSON format (and ONLY this format, no additional text):
{
  "summary": "A 2-3 sentence summary of what this document is about and its main purpose",
  "actionItems": ["List of specific actions the user should take based on this document"],
  "importantDates": [{"date": "Date in short format (e.g., 'Dec 15' or 'Jan 1, 2024')", "description": "What this date represents"}],
  "sentiment": "One of: urgent, important, low-risk, informational",
  "nextSteps": ["Numbered list of recommended next steps in order of priority"]
}

Guidelines for analysis:
- Summary: Be clear and specific about what the document is (bill, contract, notice, etc.) and the key takeaway
- Action Items: Focus on concrete tasks the user needs to do. Be specific (e.g., "Pay $150 by Dec 15" not "Pay the bill")
- Important Dates: Extract ALL mentioned deadlines, due dates, effective dates, expiration dates
- Sentiment classification:
  - urgent: Immediate action needed (past due, final notice, eviction, legal deadline within 7 days)
  - important: Action needed soon (upcoming deadline, significant decision required)
  - low-risk: Standard/routine document (regular statement, confirmation, informational update)
  - informational: No action needed (newsletters, marketing, general announcements)
- Next Steps: Prioritize by urgency and importance. Include both immediate actions and follow-up tasks

Be helpful and thorough. If something is unclear in the document, note it in your analysis.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Extract text based on file type
    let extractedText = "";
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith(".txt")) {
      // Plain text file
      extractedText = await file.text();
    } else if (fileName.endsWith(".pdf")) {
      // PDF handling using pdf-parse v2
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        extractedText = textResult.text || "";
        await parser.destroy();
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        // Fallback: send to Claude as base64 for vision
        const base64 = buffer.toString("base64");
        
        // Use Claude's vision capabilities for PDF
        const anthropic = new Anthropic({ apiKey });
        const visionResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract and transcribe all the text content from this PDF document. Return just the extracted text, no commentary."
                },
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64,
                  },
                },
              ],
            },
          ],
        });
        
        const textContent = visionResponse.content.find((block) => block.type === "text");
        extractedText = textContent && "text" in textContent ? textContent.text : "";
      }
    } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      // Image file - use Claude's vision
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      
      const mimeType = fileName.endsWith(".png") ? "image/png" 
        : fileName.endsWith(".gif") ? "image/gif"
        : fileName.endsWith(".webp") ? "image/webp"
        : "image/jpeg";
      
      const anthropic = new Anthropic({ apiKey });
      const visionResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract and transcribe all the text content from this image. Include any visible text, numbers, dates, amounts, etc. Return just the extracted text, no commentary."
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
      });
      
      const textContent = visionResponse.content.find((block) => block.type === "text");
      extractedText = textContent && "text" in textContent ? textContent.text : "";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, image, or text files." },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from the document. Please try a different file." },
        { status: 400 }
      );
    }

    // Analyze with Claude
    const anthropic = new Anthropic({ apiKey });
    const analysisResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: ANALYSIS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Please analyze this document and provide the structured JSON response:\n\n${extractedText}`,
        },
      ],
    });

    const analysisContent = analysisResponse.content.find((block) => block.type === "text");
    const analysisText = analysisContent && "text" in analysisContent ? analysisContent.text : "";

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Fallback structure
      analysis = {
        summary: analysisText.slice(0, 500),
        actionItems: ["Review the document carefully"],
        importantDates: [],
        sentiment: "informational",
        nextSteps: ["Read through the full document", "Take note of any important information"],
      };
    }

    return NextResponse.json({
      ...analysis,
      rawText: extractedText.slice(0, 2000), // Limit raw text length
    });
  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document" },
      { status: 500 }
    );
  }
}
