"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return ImageIcon;
    }
    return File;
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "dropzone rounded-2xl p-12 text-center cursor-pointer transition-all border-2 border-dashed",
          isDragActive && "active border-primary bg-primary/5",
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
                  <div className="w-20 h-20 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileIcon className="w-10 h-10 text-primary" />
                  </div>
                );
              })()}
              <div>
                <p className="font-medium truncate max-w-[300px] mx-auto">
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground">
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
              <div className="w-20 h-20 mx-auto rounded-xl bg-secondary flex items-center justify-center">
                <Upload className={cn(
                  "w-10 h-10 transition-transform",
                  isDragActive ? "text-primary scale-110" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-medium text-lg">
                  {isDragActive ? "Drop it here!" : "Drop your document here"}
                </p>
                <p className="text-muted-foreground">
                  or click to browse
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

      {/* Success message */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-green-50 text-green-700 text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Document analyzed! Check the Insights tab to view details.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supported formats */}
      <div className="flex flex-wrap gap-2 justify-center">
        {["PDF", "PNG", "JPG", "TXT"].map((format) => (
          <Badge key={format} variant="secondary" className="text-xs">
            {format}
          </Badge>
        ))}
      </div>

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
            <Upload className="w-4 h-4 mr-2" />
            Upload & Analyze
          </>
        )}
      </Button>
    </div>
  );
}

