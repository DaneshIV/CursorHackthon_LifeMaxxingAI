"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Sparkles, 
  User, 
  Loader2,
  Clipboard,
  Check,
  RefreshCw,
  Zap,
  Mail,
  ListTodo,
  FileText,
  HelpCircle,
  DollarSign,
  Home,
  Briefcase,
  Heart,
  Files,
  Wallet,
  Plus,
  Repeat,
  Receipt,
  TrendingUp,
  X,
  Paperclip,
  Globe,
  Settings,
  Mic,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DocumentInsight } from "@/app/page";
import { BudgetData } from "@/components/budget-dashboard";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type ExpenseCategory = 
  | "housing" 
  | "utilities" 
  | "food" 
  | "transport" 
  | "healthcare" 
  | "entertainment" 
  | "shopping" 
  | "subscriptions" 
  | "debt" 
  | "other";

interface DetectedBudgetItem {
  type: "subscription" | "expense" | "income";
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly" | "biweekly";
  category?: ExpenseCategory;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  detectedBudgetItems?: DetectedBudgetItem[];
}

// Helper to parse budget items from response
function parseBudgetItems(content: string): { cleanContent: string; items: DetectedBudgetItem[] } {
  const budgetMatch = content.match(/\[BUDGET_ITEMS\]([\s\S]*?)\[\/BUDGET_ITEMS\]/);
  
  if (!budgetMatch) {
    return { cleanContent: content, items: [] };
  }
  
  const cleanContent = content.replace(/\[BUDGET_ITEMS\][\s\S]*?\[\/BUDGET_ITEMS\]/, "").trim();
  
  try {
    const jsonStr = budgetMatch[1].trim();
    const parsed = JSON.parse(jsonStr);
    if (parsed.items && Array.isArray(parsed.items)) {
      return { cleanContent, items: parsed.items };
    }
  } catch (e) {
    console.error("Failed to parse budget items:", e);
  }
  
  return { cleanContent, items: [] };
}

interface ChatAssistantProps {
  documentInsights?: DocumentInsight[];
  budgetData?: BudgetData;
  onAddSubscription?: (subscription: { name: string; amount: number; frequency: "weekly" | "monthly" | "yearly" | "biweekly"; category?: ExpenseCategory }) => void;
  onAddExpense?: (expense: { name: string; amount: number; category?: ExpenseCategory }) => void;
  onAddIncome?: (income: { name: string; amount: number; frequency?: "weekly" | "biweekly" | "monthly" | "yearly" }) => void;
  visitorId?: string;
  onOpenScanner?: () => void;
}

export interface ChatAssistantRef {
  submitQuestion: (question: string) => void;
}

const QUICK_PROMPTS = [
  { icon: Mail, label: "Draft email", prompt: "Help me draft a professional email to..." },
  { icon: ListTodo, label: "Create checklist", prompt: "Create a checklist for..." },
  { icon: FileText, label: "Summarize", prompt: "Summarize the key points of..." },
  { icon: HelpCircle, label: "Explain", prompt: "Explain to me how to..." },
];

const CATEGORY_SUGGESTIONS = [
  { 
    icon: DollarSign, 
    label: "Finances", 
    color: "from-emerald-500 to-teal-600",
    questions: [
      "How do I create a monthly budget?",
      "What's the best way to start an emergency fund?",
      "How do I negotiate a lower interest rate?",
    ]
  },
  { 
    icon: Home, 
    label: "Housing", 
    color: "from-blue-500 to-indigo-600",
    questions: [
  "What should I know before signing a lease?",
      "How do I handle a security deposit dispute?",
      "What are my rights as a tenant?",
    ]
  },
  { 
    icon: Briefcase, 
    label: "Career", 
    color: "from-purple-500 to-pink-600",
    questions: [
      "How do I negotiate a salary raise?",
      "Help me prepare for a job interview",
      "How do I write a resignation letter?",
    ]
  },
  { 
    icon: Heart, 
    label: "Health", 
    color: "from-rose-500 to-orange-600",
    questions: [
      "How do I read my health insurance benefits?",
      "What should I ask at my annual checkup?",
      "How do I dispute a medical bill?",
    ]
  },
];

export const ChatAssistant = forwardRef<ChatAssistantRef, ChatAssistantProps>(
  function ChatAssistant({ documentInsights = [], budgetData, onAddSubscription, onAddExpense, onAddIncome, visitorId, onOpenScanner }, ref) {
  // Convex queries and mutations
  const convexMessages = useQuery(
    api.chat.getMessages,
    visitorId ? { visitorId } : "skip"
  );
  const addMessageMutation = useMutation(api.chat.addMessage);
  const clearMessagesMutation = useMutation(api.chat.clearMessages);
  
  // Transform Convex messages to local format
  const messages: Message[] = (convexMessages || []).map((msg) => ({
    id: msg._id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    detectedBudgetItems: msg.detectedBudgetItems as DetectedBudgetItem[] | undefined,
  }));

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [addBudgetType, setAddBudgetType] = useState<"subscription" | "expense" | "income">("subscription");
  const [addBudgetName, setAddBudgetName] = useState("");
  const [addBudgetAmount, setAddBudgetAmount] = useState("");
  const [addBudgetFrequency, setAddBudgetFrequency] = useState<"weekly" | "biweekly" | "monthly" | "yearly">("monthly");
  const [addedBudgetItems, setAddedBudgetItems] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Helper to convert to monthly
  const toMonthly = (amount: number, frequency: string): number => {
    switch (frequency) {
      case "weekly": return amount * 4.33;
      case "biweekly": return amount * 2.17;
      case "monthly": return amount;
      case "yearly": return amount / 12;
      default: return amount;
    }
  };

  // Build document context for the AI
  const buildDocumentContext = () => {
    if (documentInsights.length === 0) return null;
    
    const context = documentInsights.map((doc, i) => {
      return `
Document ${i + 1}: "${doc.fileName}"
- Summary: ${doc.summary}
- Urgency: ${doc.sentiment}
- Action Items: ${doc.actionItems.join("; ")}
- Important Dates: ${doc.importantDates.map(d => `${d.date}: ${d.description}`).join("; ") || "None specified"}
- Next Steps: ${doc.nextSteps.join("; ")}
${doc.rawText ? `- Raw Text Preview: ${doc.rawText.slice(0, 500)}...` : ""}
`;
    }).join("\n---\n");
    
    return context;
  };

  // Build budget context for the AI
  const buildBudgetContext = () => {
    if (!budgetData || (budgetData.income.length === 0 && budgetData.expenses.length === 0)) return null;
    
    const monthlyIncome = budgetData.income.reduce((sum, inc) => sum + toMonthly(inc.amount, inc.frequency), 0);
    const monthlyExpenses = budgetData.expenses.filter(e => e.isRecurring).reduce((sum, exp) => sum + toMonthly(exp.amount, exp.frequency || "monthly"), 0);
    const monthlySubscriptions = budgetData.subscriptions.reduce((sum, sub) => sum + toMonthly(sub.amount, sub.frequency), 0);
    const monthlySavings = budgetData.savingsGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);
    const totalDebt = budgetData.debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const monthlyDebtPayments = budgetData.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const disposable = monthlyIncome - monthlyExpenses - monthlySubscriptions - monthlySavings - monthlyDebtPayments;

    return `
USER'S FINANCIAL SITUATION (Currency: Malaysian Ringgit - RM):
- Monthly Income: RM${monthlyIncome.toFixed(2)}
- Monthly Recurring Expenses: RM${monthlyExpenses.toFixed(2)}
- Monthly Subscriptions: RM${monthlySubscriptions.toFixed(2)}
- Monthly Savings Contributions: RM${monthlySavings.toFixed(2)}
- Monthly Debt Payments: RM${monthlyDebtPayments.toFixed(2)}
- Disposable Income: RM${disposable.toFixed(2)}
- Total Debt: RM${totalDebt.toFixed(2)}

Income Sources: ${budgetData.income.map(i => `${i.name}: RM${i.amount}/${i.frequency}`).join(", ") || "None listed"}
Recurring Expenses: ${budgetData.expenses.filter(e => e.isRecurring).map(e => `${e.name}: RM${e.amount}`).join(", ") || "None listed"}
Subscriptions: ${budgetData.subscriptions.map(s => `${s.name}: RM${s.amount}/${s.frequency}`).join(", ") || "None listed"}
Savings Goals: ${budgetData.savingsGoals.map(g => `${g.name}: RM${g.currentAmount}/RM${g.targetAmount}`).join(", ") || "None set"}
Debts: ${budgetData.debts.map(d => `${d.name}: RM${d.remainingAmount} at ${d.interestRate}%`).join(", ") || "None listed"}
`;
  };

  // Expose submitQuestion method via ref
  useImperativeHandle(ref, () => ({
    submitQuestion: (question: string) => {
      handleSubmit(undefined, question);
    },
  }));

  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const messageText = customPrompt || input.trim();
    if (!messageText || isLoading || !visitorId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    // Save user message to Convex
    await addMessageMutation({
      visitorId,
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    });

    setInput("");
    setIsLoading(true);
    setStreamingContent("");
    setSelectedCategory(null);

    try {
      // Include document and budget context in the request
      const documentContext = buildDocumentContext();
      const budgetContext = buildBudgetContext();
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          documentContext,
          budgetContext
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullContent += parsed.text;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Parse budget items from the response
      const { cleanContent, items } = parseBudgetItems(fullContent);

      // Save assistant message to Convex
      await addMessageMutation({
        visitorId,
        role: "assistant",
        content: cleanContent,
        timestamp: Date.now(),
        detectedBudgetItems: items.length > 0 ? items : undefined,
      });

      setStreamingContent("");
    } catch (error) {
      console.error("Chat error:", error);
      // Save error message to Convex
      await addMessageMutation({
        visitorId,
        role: "assistant",
        content: "I'm having trouble connecting right now. Please make sure your API key is configured and try again.",
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Format message content with basic markdown-like styling
  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Bold text
      const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
        return (
          <div key={i} className="flex items-start gap-2 ml-2">
            <span className="text-primary mt-1">•</span>
            <span dangerouslySetInnerHTML={{ __html: boldFormatted.replace(/^[-•]\s*/, "") }} />
          </div>
        );
      }
      // Numbered lists
      const numberMatch = line.match(/^(\d+)\.\s/);
      if (numberMatch) {
        return (
          <div key={i} className="flex items-start gap-2 ml-2">
            <span className="text-primary font-medium">{numberMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: boldFormatted.replace(/^\d+\.\s*/, "") }} />
          </div>
        );
      }
      return <div key={i} dangerouslySetInnerHTML={{ __html: boldFormatted }} />;
    });
  };

  // Document-specific quick prompts
  const documentPrompts = documentInsights.length > 0 ? [
    { icon: Files, label: "My documents", prompt: "What are the key action items from all my uploaded documents?" },
    { icon: FileText, label: "Urgent items", prompt: "Are there any urgent deadlines or actions I need to take from my documents?" },
  ] : [];

  return (
    <div className="fixed inset-0 top-14 gradient-ambient overflow-hidden">
      {/* Empty State - Centered */}
      {messages.length === 0 && !streamingContent && (
        <div className="h-full flex flex-col items-center justify-center text-center px-4 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-semibold text-foreground/90 mb-2">
              What can I help you with?
            </h2>
        <p className="text-muted-foreground">
              Ask me anything about adulting, finances, or life admin
            </p>
          </motion.div>
          
          {/* Document context indicator */}
          {documentInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <div className="flex items-center gap-2 text-sm">
                <Files className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">{documentInsights.length} document{documentInsights.length !== 1 ? "s" : ""} loaded</span>
      </div>
            </motion.div>
          )}
          
          {/* Quick suggestion pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 justify-center max-w-xl"
          >
            {[
              "Help me create a budget",
              "Explain tax deductions",
              "Draft a professional email",
              "Create a to-do checklist",
            ].map((suggestion, i) => (
                    <motion.button
                      key={suggestion}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                      onClick={() => handleSubmit(undefined, suggestion)}
                className="px-4 py-2 rounded-full bg-white border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-md transition-all"
                    >
                        {suggestion}
                    </motion.button>
                  ))}
          </motion.div>
                </div>
      )}

      {/* Messages Area - When there are messages */}
      {(messages.length > 0 || streamingContent) && (
        <div className="h-full pb-48 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index === messages.length - 1 ? 0 : 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className="max-w-[80%] space-y-2">
                    <div
                      className={cn(
                          "rounded-2xl px-4 py-3 relative group",
                        message.role === "user"
                            ? "message-user rounded-br-lg"
                            : "message-assistant rounded-bl-lg"
                        )}
                      >
                        <div className="text-sm leading-relaxed space-y-1">
                          {formatContent(message.content)}
                        </div>
                      
                      {message.role === "assistant" && (
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border shadow-sm hover:bg-secondary"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Clipboard className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        )}
                      </div>


                      {/* Detected Budget Items */}
                      {message.role === "assistant" && message.detectedBudgetItems && message.detectedBudgetItems.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700">
                              Budget items detected! Add to your budget?
                            </span>
                          </div>
                          <div className="space-y-2">
                            {message.detectedBudgetItems.map((item, idx) => {
                              const itemKey = `${message.id}-${idx}-${item.name}`;
                              const isAdded = addedBudgetItems.has(itemKey);
                              
                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    "flex items-center justify-between p-2 rounded-lg border transition-all",
                                    isAdded 
                                      ? "bg-green-100 border-green-300"
                                      : "bg-white border-border"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    {item.type === "subscription" && <Repeat className="w-4 h-4 text-indigo-500" />}
                                    {item.type === "expense" && <Receipt className="w-4 h-4 text-red-500" />}
                                    {item.type === "income" && <TrendingUp className="w-4 h-4 text-green-500" />}
                                    <div>
                                      <p className="text-sm font-medium">{item.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        RM{item.amount}/{item.frequency} • {item.type}
                                        {item.category && ` • ${item.category}`}
                                      </p>
                                    </div>
                                  </div>
                                  {isAdded ? (
                                    <Badge className="bg-green-500 text-white text-xs">
                                      <Check className="w-3 h-3 mr-1" />
                                      Added
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        // Add to budget based on type
                                        if (item.type === "subscription" && onAddSubscription) {
                                          onAddSubscription({
                                            name: item.name,
                                            amount: item.amount,
                                            frequency: item.frequency,
                                            category: item.category,
                                          });
                                        } else if (item.type === "expense" && onAddExpense) {
                                          onAddExpense({
                                            name: item.name,
                                            amount: item.amount,
                                            category: item.category,
                                          });
                                        } else if (item.type === "income" && onAddIncome) {
                                          onAddIncome({
                                            name: item.name,
                                            amount: item.amount,
                                            frequency: item.frequency,
                                          });
                                        }
                                        
                                        // Mark as added
                                        setAddedBudgetItems(prev => new Set([...prev, itemKey]));
                                        toast.success(`Added "${item.name}" to your budget!`);
                                      }}
                                      className="bg-green-500 hover:bg-green-600 text-white text-xs h-7 px-2"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {/* Streaming message */}
                {streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="message-assistant rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                      <div className="text-sm leading-relaxed space-y-1">
                        {/* Clean streaming content to hide budget tags */}
                        {formatContent(streamingContent.replace(/\[BUDGET_ITEMS\][\s\S]*$/m, "").trim())}
                        <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse ml-0.5" />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {isLoading && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="message-assistant rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </motion.div>
                )}
            </div>
          </ScrollArea>
              </div>
            )}


      {/* Floating Input Bar - Centered, Dark Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50"
      >
        {/* Utility Action Buttons - Above input when there are messages */}
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            <button
              type="button"
              onClick={() => handleSubmit(undefined, `Based on your previous response, help me draft an email about this.`)}
              className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              Draft email
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(undefined, `Create a checklist based on what you just told me.`)}
              className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <ListTodo className="w-3.5 h-3.5" />
              Create checklist
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(undefined, `Summarize your previous response in 2-3 bullet points.`)}
              className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Summarize
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(undefined, `Explain this in simpler terms.`)}
              className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Explain
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(undefined, `Based on what we discussed, help me add this to my budget. What category should it be (subscription, expense, or income) and what's the amount?`)}
              className="px-3 py-1.5 rounded-full bg-green-50 backdrop-blur-sm border border-green-200 text-xs font-medium text-green-700 hover:text-green-800 hover:border-green-300 hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              Add to Budget
            </button>
      </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-border">
            {/* Input Row */}
            <div className="flex items-center px-4 py-3">
              <input
                ref={textareaRef as React.RefObject<HTMLInputElement>}
                type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message here..."
                className="flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-foreground/50 text-[15px] focus:outline-none focus:ring-0"
            disabled={isLoading}
          />
              
              {/* Send/Mic Button */}
              {isLoading ? (
                <div className="ml-2 w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              ) : input.trim() ? (
                <button
                  type="submit"
                  className="ml-2 w-9 h-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              ) : (
                <div className="ml-2 w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Icon Row - Just attachment for scanner */}
            <div className="flex items-center gap-1 px-4 pb-3 border-t border-border/50 pt-2">
              <button
                type="button"
                onClick={onOpenScanner}
                className="p-2 rounded-lg hover:bg-secondary transition-colors group flex items-center gap-2"
                title="Upload document"
              >
                <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground">Upload document</span>
              </button>
              
              <div className="flex-1" />
              
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (visitorId) {
                      await clearMessagesMutation({ visitorId });
                    }
                    setSelectedCategory(null);
                  }}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors group"
                  title="New chat"
                >
                  <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
      </form>
      </motion.div>
    </div>
  );
});
