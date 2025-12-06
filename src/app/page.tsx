"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  FileText, 
  Lightbulb,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Wallet
} from "lucide-react";
import { ChatAssistant, ChatAssistantRef } from "@/components/chat-assistant";
import { DocumentScanner } from "@/components/document-scanner";
import { InsightsPanel } from "@/components/insights-panel";
import { BudgetDashboard, BudgetData } from "@/components/budget-dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVisitorId } from "@/hooks/use-visitor-id";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type Tab = "chat" | "insights" | "budget";

const DEFAULT_BUDGET_DATA: BudgetData = {
  income: [],
  expenses: [],
  subscriptions: [],
  savingsGoals: [],
  debts: [],
};

export default function Home() {
  const visitorId = useVisitorId();
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingAIQuestion, setPendingAIQuestion] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const chatRef = useRef<ChatAssistantRef>(null);

  // Convex queries
  const insightsData = useQuery(
    api.insights.getInsights, 
    visitorId ? { visitorId } : "skip"
  );
  const budgetDataQuery = useQuery(
    api.budget.getBudgetData,
    visitorId ? { visitorId } : "skip"
  );
  const questProgress = useQuery(
    api.quests.getQuestProgress,
    visitorId ? { visitorId } : "skip"
  );
  const preferences = useQuery(
    api.preferences.getPreferences,
    visitorId ? { visitorId } : "skip"
  );

  // Convex mutations
  const addInsightMutation = useMutation(api.insights.addInsight);
  const deleteInsightMutation = useMutation(api.insights.deleteInsight);
  const setBudgetMutation = useMutation(api.budget.setBudgetData);
  const addSubscriptionMutation = useMutation(api.budget.addSubscription);
  const addExpenseMutation = useMutation(api.budget.addExpense);
  const addIncomeMutation = useMutation(api.budget.addIncome);
  const toggleTaskMutation = useMutation(api.quests.toggleTask);
  const completeOnboardingMutation = useMutation(api.preferences.completeOnboarding);

  // Transform Convex data to component format
  const insights: DocumentInsight[] = (insightsData || []).map((doc) => ({
    id: doc._id,
    fileName: doc.fileName,
    uploadedAt: new Date(doc.analyzedAt),
    summary: doc.summary,
    actionItems: doc.actionItems,
    importantDates: doc.importantDates,
    sentiment: doc.sentiment as "urgent" | "important" | "low-risk" | "informational",
    nextSteps: doc.recommendations,
    rawText: undefined,
  }));

  const budgetData: BudgetData = budgetDataQuery ? {
    income: budgetDataQuery.income.map(i => ({
      ...i,
      frequency: i.frequency as "weekly" | "biweekly" | "monthly" | "yearly",
    })),
    expenses: budgetDataQuery.expenses.map(e => ({
      ...e,
      category: e.category as "housing" | "utilities" | "food" | "transport" | "healthcare" | "entertainment" | "shopping" | "subscriptions" | "debt" | "other",
      frequency: e.frequency as "weekly" | "biweekly" | "monthly" | "yearly" | undefined,
      date: e.dueDate || new Date().toISOString().split('T')[0],
    })),
    subscriptions: budgetDataQuery.subscriptions.map(s => ({
      ...s,
      frequency: s.frequency as "weekly" | "monthly" | "yearly",
    })),
    savingsGoals: budgetDataQuery.savingsGoals,
    debts: budgetDataQuery.debts,
  } : DEFAULT_BUDGET_DATA;

  const completedTasks: string[] = questProgress?.completedTasks || [];
  
  // Wait for preferences to load before deciding onboarding state
  // preferences === undefined means still loading
  const preferencesLoaded = preferences !== undefined;
  const showOnboarding = preferencesLoaded && !preferences.hasCompletedOnboarding;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle AI questions from budget module
  useEffect(() => {
    if (pendingAIQuestion && activeTab === "chat") {
      const timer = setTimeout(() => {
        chatRef.current?.submitQuestion(pendingAIQuestion);
        setPendingAIQuestion(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingAIQuestion, activeTab]);

  const handleToggleTask = async (taskId: string) => {
    if (!visitorId) return;
    await toggleTaskMutation({ visitorId, taskId });
  };

  const handleAskAI = (question: string) => {
    setPendingAIQuestion(question);
    setActiveTab("chat");
  };

  // Budget update handlers for chat integration
  const handleAddSubscription = async (subscription: { name: string; amount: number; frequency: "weekly" | "monthly" | "yearly" | "biweekly"; category?: string }) => {
    if (!visitorId) return;
    await addSubscriptionMutation({
      visitorId,
      subscription: {
        id: Date.now().toString(),
        name: subscription.name,
        amount: subscription.amount,
        frequency: subscription.frequency,
        nextBillingDate: new Date().toISOString().split("T")[0],
        canCancel: true,
        category: subscription.category || "subscriptions",
      },
    });
  };

  const handleAddExpense = async (expense: { name: string; amount: number; category?: string }) => {
    if (!visitorId) return;
    await addExpenseMutation({
      visitorId,
      expense: {
        id: Date.now().toString(),
        name: expense.name,
        amount: expense.amount,
        category: expense.category || "other",
        isRecurring: true,
        frequency: "monthly",
      },
    });
  };

  const handleAddIncome = async (income: { name: string; amount: number; frequency?: "weekly" | "biweekly" | "monthly" | "yearly" }) => {
    if (!visitorId) return;
    await addIncomeMutation({
      visitorId,
      income: {
        id: Date.now().toString(),
        name: income.name,
        amount: income.amount,
        frequency: income.frequency || "monthly",
      },
    });
  };

  const tabs = [
    { id: "chat" as Tab, label: "Chat", icon: MessageSquare, description: "Ask anything" },
    { id: "insights" as Tab, label: "Insights", icon: Lightbulb, description: "View all", badge: insights.length || undefined },
    { id: "budget" as Tab, label: "Budget", icon: Wallet, description: "Finances" },
  ];

  const handleNewInsight = async (insight: DocumentInsight) => {
    if (!visitorId) return;
    await addInsightMutation({
      visitorId,
      fileName: insight.fileName,
      fileType: insight.fileName.split(".").pop() || "unknown",
      summary: insight.summary,
      actionItems: insight.actionItems,
      importantDates: insight.importantDates,
      sentiment: insight.sentiment,
      category: "general",
      recommendations: insight.nextSteps,
      analyzedAt: new Date().toISOString(),
    });
  };

  const handleDeleteInsight = async (id: string) => {
    await deleteInsightMutation({ id: id as Id<"documentInsights"> });
  };

  const handleUpdateBudget = async (newBudgetData: BudgetData) => {
    if (!visitorId) return;
    await setBudgetMutation({
      visitorId,
      income: newBudgetData.income.map(i => ({
        ...i,
        frequency: i.frequency,
      })),
      expenses: newBudgetData.expenses.map(e => ({
        ...e,
        category: e.category,
        frequency: e.frequency,
      })),
      subscriptions: newBudgetData.subscriptions.map(s => ({
        ...s,
        frequency: s.frequency,
      })),
      savingsGoals: newBudgetData.savingsGoals,
      debts: newBudgetData.debts,
    });
  };

  const completeOnboarding = async () => {
    if (!visitorId) return;
    await completeOnboardingMutation({ visitorId });
  };

  // Don't render until mounted, visitorId loaded, and preferences loaded
  if (!mounted || !visitorId || !preferencesLoaded) {
    return (
      <div className="min-h-screen gradient-warm noise flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center shadow-xl"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    );
  }

  // Onboarding screen
  if (showOnboarding) {
    return (
      <div className="min-h-screen gradient-warm noise flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          {/* Hero */}
          <div className="text-center mb-8">
            <motion.div 
              className="w-24 h-24 mx-auto rounded-3xl gradient-accent flex items-center justify-center mb-6 shadow-2xl shadow-primary/30"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-3"
            >
              Welcome to AdultingOS
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              Your AI-powered life admin co-pilot. <br />
              No more dreading the boring stuff.
            </motion.p>
          </div>

          {/* Features - Calm utility style */}
          <div className="space-y-3 mb-8">
            {[
              { icon: MessageSquare, title: "Smart Chat Assistant", description: "Get instant help with emails, taxes, budgets, and more", color: "bg-[#E07B54]" },
              { icon: FileText, title: "Document Scanner", description: "Upload bills and contracts for AI-powered analysis", color: "bg-[#7CB9A8]" },
              { icon: Zap, title: "Instant Insights", description: "Get action items, deadlines, and next steps automatically", color: "bg-[#6B98C4]" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white border border-border card-hover"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", feature.color)}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] mb-0.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Private & Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>24/7 Available</span>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button 
              onClick={completeOnboarding}
              className="w-full h-14 text-lg rounded-2xl gradient-accent hover:opacity-90 shadow-lg shadow-primary/20 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              No sign-up required • Powered by Claude AI
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm">
      {/* Header - Clean, minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <motion.div 
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">AdultingOS</h1>
              </div>
            </div>

            {/* Desktop Navigation - Pill style */}
            <nav className="hidden md:flex items-center gap-1 bg-secondary rounded-full p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50 bg-white/90"
            >
              <div className="p-4 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium">{tab.label}</p>
                      <p className={cn(
                        "text-xs",
                        activeTab === tab.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>{tab.description}</p>
                    </div>
                    {tab.badge && (
                      <span className="w-6 h-6 rounded-full bg-white/20 text-xs flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Chat Tab - Full screen */}
      {activeTab === "chat" && (
        <ChatAssistant 
          ref={chatRef}
          documentInsights={insights} 
          budgetData={budgetData}
          onAddSubscription={handleAddSubscription}
          onAddExpense={handleAddExpense}
          onAddIncome={handleAddIncome}
          visitorId={visitorId}
          onOpenScanner={() => setShowScanner(true)}
        />
      )}

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowScanner(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-auto"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">Upload Document</h2>
                <button
                  onClick={() => setShowScanner(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <DocumentScanner 
                  onNewInsight={(insight) => {
                    handleNewInsight(insight);
                    setShowScanner(false);
                  }} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Wide container for other tabs */}
      <main className={cn("pt-16 pb-24 min-h-screen", activeTab === "chat" && "hidden")}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {activeTab === "insights" && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InsightsPanel 
                  insights={insights} 
                  onDeleteInsight={handleDeleteInsight}
                  completedTasks={completedTasks}
                  onToggleTask={handleToggleTask}
                  visitorId={visitorId}
                />
              </motion.div>
            )}
            {activeTab === "budget" && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BudgetDashboard 
                  budgetData={budgetData}
                  onUpdateBudget={handleUpdateBudget}
                  documentInsights={insights}
                  onAskAI={handleAskAI}
                  visitorId={visitorId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}

export interface DocumentInsight {
  id: string;
  fileName: string;
  uploadedAt: Date;
  summary: string;
  actionItems: string[];
  importantDates: { date: string; description: string }[];
  sentiment: "urgent" | "important" | "low-risk" | "informational";
  nextSteps: string[];
  rawText?: string;
}
