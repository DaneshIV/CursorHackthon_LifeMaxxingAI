"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  ListChecks,
  Lightbulb,
  ChevronRight,
  X,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DocumentInsight } from "@/app/page";

interface DocumentScannerProps {
  onNewInsight: (insight: DocumentInsight) => void;
}

type ProcessingStep = "uploading" | "extracting" | "analyzing" | "complete";

const STEP_LABELS: Record<ProcessingStep, string> = {
  uploading: "Uploading document...",
  extracting: "Extracting text...",
  analyzing: "AI analyzing content...",
  complete: "Analysis complete!",
};

const STEP_PROGRESS: Record<ProcessingStep, number> = {
  uploading: 25,
  extracting: 50,
  analyzing: 75,
  complete: 100,
};

export function DocumentScanner({ onNewInsight }: DocumentScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep | null>(null);
  const [result, setResult] = useState<DocumentInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const processDocument = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setCurrentStep("uploading");

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      setCurrentStep("extracting");
      
      // Send to API
      const response = await fetch("/api/analyze-document", {
        method: "POST",
        body: formData,
      });

      setCurrentStep("analyzing");

      if (!response.ok) {
        throw new Error("Failed to analyze document");
      }

      const data = await response.json();
      
      setCurrentStep("complete");
      
      const insight: DocumentInsight = {
        id: Date.now().toString(),
        fileName: file.name,
        uploadedAt: new Date(),
        summary: data.summary,
        actionItems: data.actionItems,
        importantDates: data.importantDates,
        sentiment: data.sentiment,
        nextSteps: data.nextSteps,
        rawText: data.rawText,
      };

      setResult(insight);
      onNewInsight(insight);

      // Auto-reset after success
      setTimeout(() => {
        setCurrentStep(null);
      }, 2000);
    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process document. Please try again.");
      setCurrentStep(null);
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setCurrentStep(null);
  };

  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case "urgent":
        return { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, label: "Urgent" };
      case "important":
        return { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock, label: "Important" };
      case "low-risk":
        return { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Low Risk" };
      default:
        return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: FileText, label: "Informational" };
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return ImageIcon;
    }
    return File;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-1">Document Scanner</h2>
        <p className="text-muted-foreground">
          Upload bills, letters, contracts — get instant AI-powered insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <Card className="bg-white/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "dropzone rounded-2xl p-8 text-center cursor-pointer transition-all",
                isDragActive && "active",
                file && "border-primary/50 bg-primary/5"
              )}
            >
              <input {...getInputProps()} />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-3"
                  >
                    {(() => {
                      const FileIcon = getFileIcon(file.name);
                      return (
                        <div className="w-16 h-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileIcon className="w-8 h-8 text-primary" />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px] mx-auto">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetScanner();
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="w-16 h-16 mx-auto rounded-xl bg-secondary flex items-center justify-center">
                      <Upload className={cn(
                        "w-8 h-8 transition-transform",
                        isDragActive ? "text-primary scale-110" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">
                        {isDragActive ? "Drop it here!" : "Drop your document here"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse • PDF, images, text
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress */}
            <AnimatePresence>
              {currentStep && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{STEP_LABELS[currentStep]}</span>
                    <span className="font-medium">{STEP_PROGRESS[currentStep]}%</span>
                  </div>
                  <Progress value={STEP_PROGRESS[currentStep]} className="h-2" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyze Button */}
            <Button
              onClick={processDocument}
              disabled={!file || processing}
              className="w-full rounded-xl h-12 gradient-accent hover:opacity-90"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Analyze Document
                </>
              )}
            </Button>

            {/* Supported formats */}
            <div className="flex flex-wrap gap-2 justify-center">
              {["PDF", "PNG", "JPG", "TXT"].map((format) => (
                <Badge key={format} variant="secondary" className="text-xs">
                  {format}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results Area */}
        <Card className="bg-white/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5"
                >
                  {/* Sentiment Badge */}
                  {(() => {
                    const config = getSentimentConfig(result.sentiment);
                    return (
                      <div className="flex items-center gap-2">
                        <Badge className={cn("gap-1", config.color)}>
                          <config.icon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Analyzed just now
                        </span>
                      </div>
                    );
                  })()}

                  {/* Summary */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Summary
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  <Separator />

                  {/* Action Items */}
                  {result.actionItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-primary" />
                        Action Items
                      </h4>
                      <ul className="space-y-1.5">
                        {result.actionItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Important Dates */}
                  {result.importantDates.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Important Dates
                        </h4>
                        <div className="space-y-2">
                          {result.importantDates.map((date, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xs font-medium">
                                {date.date}
                              </div>
                              <span className="text-sm text-muted-foreground flex-1">
                                {date.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Next Steps */}
                  {result.nextSteps.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-accent" />
                          Recommended Next Steps
                        </h4>
                        <ol className="space-y-1.5">
                          {result.nextSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-muted-foreground">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[400px] flex flex-col items-center justify-center text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h4 className="font-medium mb-1">No document analyzed yet</h4>
                  <p className="text-sm text-muted-foreground max-w-[250px]">
                    Upload a document to get instant AI-powered insights and action items
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

