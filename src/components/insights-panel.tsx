"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  ListChecks,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Inbox,
  Filter,
  Search,
  Trash2,
  Download,
  Share2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DocumentInsight } from "@/app/page";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { QuestTracker } from "./quest-tracker";

interface InsightsPanelProps {
  insights: DocumentInsight[];
  onDeleteInsight?: (id: string) => void;
  completedTasks?: string[];
  onToggleTask?: (taskId: string) => void;
  visitorId?: string;
}

type FilterType = "all" | "urgent" | "important" | "low-risk" | "informational";

const FILTER_OPTIONS: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Filter },
  { value: "urgent", label: "Urgent", icon: AlertCircle },
  { value: "important", label: "Important", icon: Clock },
  { value: "low-risk", label: "Low Risk", icon: CheckCircle2 },
  { value: "informational", label: "Info", icon: FileText },
];

export function InsightsPanel({ insights, onDeleteInsight, completedTasks = [], onToggleTask, visitorId }: InsightsPanelProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredInsights = insights.filter((insight) => {
    const matchesFilter = filter === "all" || insight.sentiment === filter;
    const matchesSearch =
      searchQuery === "" ||
      insight.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  const stats = {
    total: insights.length,
    urgent: insights.filter((i) => i.sentiment === "urgent").length,
    important: insights.filter((i) => i.sentiment === "important").length,
    actionItems: insights.reduce((acc, i) => acc + i.actionItems.length, 0),
  };

  const handleDelete = (id: string, fileName: string) => {
    if (onDeleteInsight) {
      onDeleteInsight(id);
      toast.success(`Deleted "${fileName}"`);
      if (expandedId === id) {
        setExpandedId(null);
      }
    }
  };

  const handleExport = (insight: DocumentInsight) => {
    const content = `
# ${insight.fileName}
Analyzed: ${insight.uploadedAt.toLocaleDateString()}

## Summary
${insight.summary}

## Action Items
${insight.actionItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}

## Important Dates
${insight.importantDates.map((d) => `- ${d.date}: ${d.description}`).join("\n")}

## Next Steps
${insight.nextSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}
    `.trim();

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${insight.fileName.replace(/\.[^/.]+$/, "")}-insights.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported insights to markdown");
  };

  const handleShare = async (insight: DocumentInsight) => {
    const text = `📄 ${insight.fileName}\n\n${insight.summary}\n\n✅ Action Items:\n${insight.actionItems.map((item) => `• ${item}`).join("\n")}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-1">Insights Dashboard</h2>
        <p className="text-muted-foreground">
          All your analyzed documents and action items in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Documents", value: stats.total, icon: FileText, color: "text-primary", bgColor: "bg-primary/10" },
          { label: "Urgent", value: stats.urgent, icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-50" },
          { label: "Important", value: stats.important, icon: Clock, color: "text-amber-500", bgColor: "bg-amber-50" },
          { label: "Action Items", value: stats.actionItems, icon: ListChecks, color: "text-green-600", bgColor: "bg-green-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-white/60 backdrop-blur-sm border-border/50 card-hover overflow-hidden">
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <motion.p 
                      className="text-3xl font-semibold mt-1"
                      key={stat.value}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bgColor, stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                {/* Decorative gradient */}
                <div className={cn("absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-50", 
                  stat.label === "Urgent" ? "from-red-400 to-red-600" :
                  stat.label === "Important" ? "from-amber-400 to-amber-600" :
                  stat.label === "Action Items" ? "from-green-400 to-green-600" :
                  "from-primary to-primary/60"
                )} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quest Tracker */}
      {onToggleTask && visitorId && (
        <QuestTracker 
          insights={insights} 
          completedTasks={completedTasks} 
          onToggleTask={onToggleTask}
          visitorId={visitorId}
        />
      )}

      {/* Filters and Search */}
      <Card className="bg-white/60 backdrop-blur-sm border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 border-border/50 rounded-xl"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "rounded-full flex-shrink-0 gap-1.5",
                    filter === option.value
                      ? "gradient-accent hover:opacity-90"
                      : "bg-white/80 hover:bg-white"
                  )}
                >
                  <option.icon className="w-3.5 h-3.5" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <Card className="bg-white/60 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            Recent Insights
            {filteredInsights.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredInsights.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="popLayout">
            {filteredInsights.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <motion.div 
                  className="w-20 h-20 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Inbox className="w-10 h-10 text-muted-foreground/50" />
                </motion.div>
                <h4 className="font-medium mb-1">No insights yet</h4>
                <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                  {insights.length === 0
                    ? "Upload and analyze documents to see your insights here"
                    : "No documents match your current filters"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredInsights.map((insight, i) => {
                  const config = getSentimentConfig(insight.sentiment);
                  const isExpanded = expandedId === insight.id;

                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: i * 0.05 }}
                      layout
                    >
                      <div
                        className={cn(
                          "rounded-xl border bg-white/80 overflow-hidden transition-all",
                          isExpanded ? "shadow-lg ring-2 ring-primary/10" : "hover:shadow-md"
                        )}
                      >
                        {/* Header */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                          className="w-full p-4 flex items-center gap-4 text-left"
                        >
                          <motion.div 
                            className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.color)}
                            whileHover={{ scale: 1.1 }}
                          >
                            <config.icon className="w-5 h-5" />
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{insight.fileName}</h4>
                              <Badge className={cn("text-xs", config.color)}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {insight.summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-muted-foreground hidden md:block">
                              {formatDistanceToNow(insight.uploadedAt, { addSuffix: true })}
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </motion.div>
                          </div>
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Separator />
                              <div className="p-4 space-y-4 bg-secondary/20">
                                {/* Actions Bar */}
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleShare(insight)}
                                    className="gap-1.5 rounded-lg"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    Share
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport(insight)}
                                    className="gap-1.5 rounded-lg"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Export
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(insight.id, insight.fileName)}
                                    className="gap-1.5 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </Button>
                                </div>

                                {/* Summary */}
                                <div>
                                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Full Summary
                                  </h5>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {insight.summary}
                                  </p>
                                </div>

                                {/* Action Items */}
                                {insight.actionItems.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <ListChecks className="w-4 h-4 text-primary" />
                                      Action Items ({insight.actionItems.length})
                                    </h5>
                                    <ul className="space-y-1.5">
                                      {insight.actionItems.map((item, j) => (
                                        <motion.li 
                                          key={j} 
                                          className="flex items-start gap-2 text-sm"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: j * 0.05 }}
                                        >
                                          <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                          <span className="text-muted-foreground">{item}</span>
                                        </motion.li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Important Dates */}
                                {insight.importantDates.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-primary" />
                                      Important Dates
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {insight.importantDates.map((date, j) => (
                                        <motion.div
                                          key={j}
                                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border text-sm"
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: j * 0.05 }}
                                        >
                                          <span className="font-medium text-primary">{date.date}</span>
                                          <span className="text-muted-foreground">—</span>
                                          <span className="text-muted-foreground">{date.description}</span>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Next Steps */}
                                {insight.nextSteps.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Lightbulb className="w-4 h-4 text-accent" />
                                      Recommended Next Steps
                                    </h5>
                                    <ol className="space-y-1.5">
                                      {insight.nextSteps.map((step, j) => (
                                        <motion.li 
                                          key={j} 
                                          className="flex items-start gap-2 text-sm"
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: j * 0.05 }}
                                        >
                                          <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium flex-shrink-0">
                                            {j + 1}
                                          </span>
                                          <span className="text-muted-foreground">{step}</span>
                                        </motion.li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
