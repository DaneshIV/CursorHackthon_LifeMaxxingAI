"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PiggyBank,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Receipt,
  Repeat,
  Target,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Calculator,
  FileText,
  Lightbulb,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DocumentInsight } from "@/app/page";

// Types
export interface BudgetData {
  income: IncomeSource[];
  expenses: Expense[];
  subscriptions: Subscription[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "yearly";
  nextDate?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  isRecurring: boolean;
  frequency?: "weekly" | "biweekly" | "monthly" | "yearly";
  documentId?: string; // Link to scanned document
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  nextBillingDate: string;
  category: string;
  canCancel: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  monthlyContribution: number;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
}

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

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string; icon: React.ElementType }> = {
  housing: { label: "Housing", color: "bg-blue-500", icon: Wallet },
  utilities: { label: "Utilities", color: "bg-yellow-500", icon: Lightbulb },
  food: { label: "Food", color: "bg-green-500", icon: Receipt },
  transport: { label: "Transport", color: "bg-purple-500", icon: CreditCard },
  healthcare: { label: "Healthcare", color: "bg-red-500", icon: AlertCircle },
  entertainment: { label: "Entertainment", color: "bg-pink-500", icon: Sparkles },
  shopping: { label: "Shopping", color: "bg-orange-500", icon: CreditCard },
  subscriptions: { label: "Subscriptions", color: "bg-indigo-500", icon: Repeat },
  debt: { label: "Debt Payments", color: "bg-gray-500", icon: TrendingDown },
  other: { label: "Other", color: "bg-slate-500", icon: DollarSign },
};

interface BudgetDashboardProps {
  budgetData: BudgetData;
  onUpdateBudget: (data: BudgetData) => void;
  documentInsights: DocumentInsight[];
  onAskAI: (question: string) => void;
  visitorId?: string;
}

// Helper function to calculate monthly amount
const toMonthly = (amount: number, frequency: string): number => {
  switch (frequency) {
    case "weekly": return amount * 4.33;
    case "biweekly": return amount * 2.17;
    case "monthly": return amount;
    case "yearly": return amount / 12;
    default: return amount;
  }
};

// Affordability Calculator Component
function AffordabilityCalculator({ 
  monthlyIncome, 
  monthlyExpenses,
  onAskAI 
}: { 
  monthlyIncome: number; 
  monthlyExpenses: number;
  onAskAI: (q: string) => void;
}) {
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [result, setResult] = useState<{
    canAfford: boolean;
    message: string;
    impact: string;
  } | null>(null);

  const monthlyDisposable = monthlyIncome - monthlyExpenses;

  const calculate = () => {
    const cost = parseFloat(itemCost);
    if (isNaN(cost)) return;

    const monthlyImpact = isRecurring ? cost : cost;
    const newDisposable = monthlyDisposable - (isRecurring ? cost : 0);
    const percentOfDisposable = (cost / monthlyDisposable) * 100;

    let canAfford = false;
    let message = "";
    let impact = "";

    if (isRecurring) {
      if (newDisposable > monthlyDisposable * 0.2) {
        canAfford = true;
        message = `Yes! You can afford RM${cost}/month for ${itemName}.`;
        impact = `This would use ${percentOfDisposable.toFixed(1)}% of your disposable income.`;
      } else if (newDisposable > 0) {
        canAfford = true;
        message = `You can afford it, but it's tight.`;
        impact = `This would use ${percentOfDisposable.toFixed(1)}% of your disposable income. Consider if it's essential.`;
      } else {
        canAfford = false;
        message = `This would put you over budget.`;
        impact = `You'd need to cut RM${Math.abs(newDisposable).toFixed(2)}/month elsewhere.`;
      }
    } else {
      // One-time purchase
      if (cost <= monthlyDisposable * 0.5) {
        canAfford = true;
        message = `Yes! You can afford ${itemName} this month.`;
        impact = `This is ${percentOfDisposable.toFixed(1)}% of your monthly disposable income.`;
      } else if (cost <= monthlyDisposable) {
        canAfford = true;
        message = `You can afford it, but it'll use most of your extra cash.`;
        impact = `Consider waiting or saving for ${Math.ceil(cost / (monthlyDisposable * 0.3))} months.`;
      } else {
        canAfford = false;
        message = `This is more than your monthly disposable income.`;
        impact = `Save for ${Math.ceil(cost / monthlyDisposable)} months to afford this comfortably.`;
      }
    }

    setResult({ canAfford, message, impact });
  };

  return (
    <Card className="bg-gradient-to-br from-white/80 to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Can I Afford This?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">What do you want?</label>
            <Input
              placeholder="e.g., New laptop"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">How much?</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="0.00"
                value={itemCost}
                onChange={(e) => setItemCost(e.target.value)}
                className="pl-10 bg-white/80"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsRecurring(false)}
            className={cn(
              "flex-1 p-3 rounded-xl border-2 transition-all text-sm",
              !isRecurring
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <Receipt className="w-4 h-4 mx-auto mb-1" />
            One-time
          </button>
          <button
            onClick={() => setIsRecurring(true)}
            className={cn(
              "flex-1 p-3 rounded-xl border-2 transition-all text-sm",
              isRecurring
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <Repeat className="w-4 h-4 mx-auto mb-1" />
            Monthly
          </button>
        </div>

        <Button
          onClick={calculate}
          disabled={!itemName || !itemCost}
          className="w-full gradient-accent"
        >
          Check Affordability
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "p-4 rounded-xl border-2",
                result.canAfford
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <div className="flex items-start gap-3">
                {result.canAfford ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={cn(
                    "font-medium",
                    result.canAfford ? "text-green-700" : "text-red-700"
                  )}>
                    {result.message}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.impact}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAskAI(`Should I buy ${itemName} for RM${itemCost}? My monthly disposable income is RM${monthlyDisposable.toFixed(2)}. Give me financial advice.`)}
                className="mt-3 w-full text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Get AI advice on this purchase
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Add Income/Expense Dialog
function AddTransactionDialog({
  type,
  onAdd,
  trigger,
}: {
  type: "income" | "expense";
  onAdd: (data: IncomeSource | Expense) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly" | "yearly">("monthly");
  const [isRecurring, setIsRecurring] = useState(type === "income");

  const handleSubmit = () => {
    if (!name || !amount) return;

    if (type === "income") {
      onAdd({
        id: Date.now().toString(),
        name,
        amount: parseFloat(amount),
        frequency,
      } as IncomeSource);
    } else {
      onAdd({
        id: Date.now().toString(),
        name,
        amount: parseFloat(amount),
        category,
        date: new Date().toISOString().split("T")[0],
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
      } as Expense);
    }

    setName("");
    setAmount("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {type === "income" ? "Income Source" : "Expense"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name</label>
            <Input
              placeholder={type === "income" ? "e.g., Salary" : "e.g., Rent"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {type === "expense" && (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(CATEGORY_CONFIG).slice(0, 8).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key as ExpenseCategory)}
                      className={cn(
                        "p-2 rounded-lg border-2 transition-all text-xs flex flex-col items-center gap-1",
                        category === key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="recurring" className="text-sm">
                  This is a recurring expense
                </label>
              </div>
            </>
          )}

          {(type === "income" || isRecurring) && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Frequency</label>
              <div className="grid grid-cols-4 gap-2">
                {["weekly", "biweekly", "monthly", "yearly"].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setFrequency(freq as typeof frequency)}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-all text-xs capitalize",
                      frequency === freq
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full gradient-accent">
            Add {type === "income" ? "Income" : "Expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Income/Expense Dialog
function EditTransactionDialog({
  type,
  item,
  onSave,
  trigger,
}: {
  type: "income" | "expense";
  item: IncomeSource | Expense;
  onSave: (id: string, name: string, amount: number, category: string, frequency?: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(item.amount.toString());
  const [category, setCategory] = useState<ExpenseCategory>(
    type === "expense" ? (item as Expense).category : "other"
  );
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly" | "yearly">(
    (item as IncomeSource).frequency || "monthly"
  );

  const handleSubmit = () => {
    if (!name || !amount) return;

    if (type === "income") {
      onSave(item.id, name, parseFloat(amount), "other", frequency);
    } else {
      onSave(item.id, name, parseFloat(amount), category, frequency);
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {type === "income" ? "Income Source" : "Expense"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name</label>
            <Input
              placeholder={type === "income" ? "e.g., Salary" : "e.g., Rent"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {type === "expense" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(CATEGORY_CONFIG).slice(0, 8).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key as ExpenseCategory)}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-all text-xs flex flex-col items-center gap-1",
                      category === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Frequency</label>
            <div className="grid grid-cols-4 gap-2">
              {["weekly", "biweekly", "monthly", "yearly"].map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq as typeof frequency)}
                  className={cn(
                    "p-2 rounded-lg border-2 transition-all text-xs capitalize",
                    frequency === freq
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full gradient-accent">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Subscription Dialog
function EditSubscriptionDialog({
  subscription,
  onSave,
  trigger,
}: {
  subscription: Subscription;
  onSave: (id: string, name: string, amount: number, frequency: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(subscription.name);
  const [amount, setAmount] = useState(subscription.amount.toString());
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">(subscription.frequency);

  const handleSubmit = () => {
    if (!name || !amount) return;
    onSave(subscription.id, name, parseFloat(amount), frequency);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Service Name</label>
            <Input
              placeholder="e.g., Netflix, Spotify..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Billing Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={cn(
                    "p-2 rounded-lg border-2 transition-all text-xs capitalize",
                    frequency === freq
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-accent">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Savings Goal Dialog
function AddSavingsGoalDialog({
  onAdd,
  trigger,
}: {
  onAdd: (data: SavingsGoal) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");

  const handleSubmit = () => {
    if (!name || !targetAmount) return;

    onAdd({
      id: Date.now().toString(),
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      monthlyContribution: parseFloat(monthlyContribution) || 0,
    });

    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setMonthlyContribution("");
    setOpen(false);
  };

  const GOAL_SUGGESTIONS = [
    { name: "Emergency Fund", icon: "🏦", target: 10000 },
    { name: "Vacation", icon: "✈️", target: 5000 },
    { name: "New Car", icon: "🚗", target: 30000 },
    { name: "Home Down Payment", icon: "🏠", target: 50000 },
    { name: "Education", icon: "📚", target: 20000 },
    { name: "Retirement", icon: "🌴", target: 100000 },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Add Savings Goal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Quick Suggestions */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Start</label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                <button
                  key={suggestion.name}
                  onClick={() => {
                    setName(suggestion.name);
                    setTargetAmount(suggestion.target.toString());
                  }}
                  className={cn(
                    "p-2 rounded-lg border-2 transition-all text-xs flex flex-col items-center gap-1",
                    name === suggestion.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  <span className="truncate w-full text-center">{suggestion.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Goal Name</label>
            <Input
              placeholder="e.g., Emergency Fund, Vacation..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Target Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="10,000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Current Savings (Optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">How much have you saved so far?</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Monthly Contribution</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">How much will you save each month?</p>
          </div>

          {/* Preview */}
          {targetAmount && monthlyContribution && parseFloat(monthlyContribution) > 0 && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">
                🎯 At RM{parseFloat(monthlyContribution).toLocaleString()}/month, you&apos;ll reach your goal in{" "}
                <span className="font-semibold">
                  {Math.ceil((parseFloat(targetAmount) - (parseFloat(currentAmount) || 0)) / parseFloat(monthlyContribution))} months
                </span>
              </p>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full gradient-accent">
            <Target className="w-4 h-4 mr-2" />
            Create Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Subscription Dialog
function AddSubscriptionDialog({
  onAdd,
  trigger,
}: {
  onAdd: (data: Subscription) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [category, setCategory] = useState("entertainment");
  const [nextBillingDate, setNextBillingDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = () => {
    if (!name || !amount) return;

    onAdd({
      id: Date.now().toString(),
      name,
      amount: parseFloat(amount),
      frequency,
      category,
      nextBillingDate,
      canCancel: true,
    });

    setName("");
    setAmount("");
    setCategory("entertainment");
    setOpen(false);
  };

  const SUBSCRIPTION_CATEGORIES = [
    "Entertainment",
    "Software",
    "Music",
    "Video",
    "News",
    "Fitness",
    "Food",
    "Other",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Service Name</label>
            <Input
              placeholder="e.g., Netflix, Spotify, Adobe..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">RM</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Billing Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {(["weekly", "monthly", "yearly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={cn(
                    "p-2 rounded-lg border-2 transition-all text-sm capitalize",
                    frequency === freq
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {SUBSCRIPTION_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat.toLowerCase())}
                  className={cn(
                    "p-2 rounded-lg border-2 transition-all text-xs",
                    category === cat.toLowerCase()
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Next Billing Date</label>
            <Input
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-accent">
            Add Subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Savings Goal Component
function SavingsGoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: SavingsGoal;
  onUpdate: (goal: SavingsGoal) => void;
  onDelete: () => void;
}) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsToGoal = goal.monthlyContribution > 0 
    ? Math.ceil(remaining / goal.monthlyContribution)
    : Infinity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-white/80 border border-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium">{goal.name}</h4>
            <p className="text-xs text-muted-foreground">
              RM{goal.monthlyContribution}/month
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            RM{goal.currentAmount.toLocaleString()} of RM{goal.targetAmount.toLocaleString()}
          </span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <Progress value={progress} className="h-3" />
        <p className="text-xs text-muted-foreground">
          {monthsToGoal === Infinity
            ? "Set a monthly contribution to track progress"
            : monthsToGoal === 0
            ? "🎉 Goal reached!"
            : `${monthsToGoal} months to reach goal`}
        </p>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const addAmount = parseFloat(prompt("How much to add?") || "0");
            if (addAmount > 0) {
              onUpdate({
                ...goal,
                currentAmount: goal.currentAmount + addAmount,
              });
            }
          }}
          className="flex-1 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Funds
        </Button>
      </div>
    </motion.div>
  );
}

// Main Budget Dashboard Component
export function BudgetDashboard({
  budgetData,
  onUpdateBudget,
  documentInsights,
  onAskAI,
  visitorId,
}: BudgetDashboardProps) {
  const [activeView, setActiveView] = useState<"overview" | "bills" | "subscriptions" | "goals">("overview");

  // Calculate totals
  const monthlyIncome = useMemo(() => {
    return budgetData.income.reduce((sum, inc) => sum + toMonthly(inc.amount, inc.frequency), 0);
  }, [budgetData.income]);

  const monthlyExpenses = useMemo(() => {
    const recurringExpenses = budgetData.expenses
      .filter((e) => e.isRecurring)
      .reduce((sum, exp) => sum + toMonthly(exp.amount, exp.frequency || "monthly"), 0);
    
    const subscriptions = budgetData.subscriptions
      .reduce((sum, sub) => sum + toMonthly(sub.amount, sub.frequency), 0);

    return recurringExpenses + subscriptions;
  }, [budgetData.expenses, budgetData.subscriptions]);

  const monthlyDebtPayments = useMemo(() => {
    return budgetData.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  }, [budgetData.debts]);

  const totalDebt = useMemo(() => {
    return budgetData.debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  }, [budgetData.debts]);

  const monthlySavings = useMemo(() => {
    return budgetData.savingsGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);
  }, [budgetData.savingsGoals]);

  const disposableIncome = monthlyIncome - monthlyExpenses - monthlyDebtPayments - monthlySavings;

  // Detect bills from documents
  const detectedBills = useMemo(() => {
    return documentInsights
      .filter((doc) => 
        doc.sentiment === "urgent" || 
        doc.sentiment === "important" ||
        doc.summary.toLowerCase().includes("bill") ||
        doc.summary.toLowerCase().includes("payment") ||
        doc.summary.toLowerCase().includes("invoice")
      )
      .map((doc) => ({
        id: doc.id,
        name: doc.fileName,
        summary: doc.summary,
        actionItems: doc.actionItems,
        dates: doc.importantDates,
        sentiment: doc.sentiment,
      }));
  }, [documentInsights]);

  // Add handlers
  const handleAddIncome = (income: IncomeSource) => {
    onUpdateBudget({
      ...budgetData,
      income: [...budgetData.income, income],
    });
  };

  const handleAddExpense = (expense: Expense) => {
    onUpdateBudget({
      ...budgetData,
      expenses: [...budgetData.expenses, expense],
    });
  };

  const handleDeleteIncome = (id: string) => {
    onUpdateBudget({
      ...budgetData,
      income: budgetData.income.filter((i) => i.id !== id),
    });
  };

  const handleEditIncome = (id: string, name: string, amount: number, frequency: string) => {
    onUpdateBudget({
      ...budgetData,
      income: budgetData.income.map((i) =>
        i.id === id ? { ...i, name, amount, frequency: frequency as IncomeSource["frequency"] } : i
      ),
    });
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateBudget({
      ...budgetData,
      expenses: budgetData.expenses.filter((e) => e.id !== id),
    });
  };

  const handleEditExpense = (id: string, name: string, amount: number, category: string, frequency?: string) => {
    onUpdateBudget({
      ...budgetData,
      expenses: budgetData.expenses.map((e) =>
        e.id === id ? { ...e, name, amount, category: category as ExpenseCategory, frequency: frequency as Expense["frequency"] } : e
      ),
    });
  };

  const handleEditSubscription = (id: string, name: string, amount: number, frequency: string) => {
    onUpdateBudget({
      ...budgetData,
      subscriptions: budgetData.subscriptions.map((s) =>
        s.id === id ? { ...s, name, amount, frequency: frequency as Subscription["frequency"] } : s
      ),
    });
  };

  const handleAddSubscription = (subscription: Subscription) => {
    onUpdateBudget({
      ...budgetData,
      subscriptions: [...budgetData.subscriptions, subscription],
    });
  };

  const handleDeleteSubscription = (id: string) => {
    onUpdateBudget({
      ...budgetData,
      subscriptions: budgetData.subscriptions.filter((s) => s.id !== id),
    });
  };

  const handleAddSavingsGoal = (goal: SavingsGoal) => {
    onUpdateBudget({
      ...budgetData,
      savingsGoals: [...budgetData.savingsGoals, goal],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Budget & Finance</h2>
          <p className="text-muted-foreground">
            Track expenses, plan savings, and make smarter financial decisions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onAskAI("Give me a financial health check based on my budget. What should I focus on?")}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI Financial Advice
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: "Monthly Income", 
            value: monthlyIncome, 
            icon: TrendingUp, 
            color: "text-green-600",
            bgColor: "bg-green-50"
          },
          { 
            label: "Monthly Expenses", 
            value: monthlyExpenses + monthlyDebtPayments, 
            icon: TrendingDown, 
            color: "text-red-500",
            bgColor: "bg-red-50"
          },
          { 
            label: "Savings Rate", 
            value: monthlyIncome > 0 ? ((monthlySavings / monthlyIncome) * 100) : 0, 
            icon: PiggyBank, 
            color: "text-blue-500",
            bgColor: "bg-blue-50",
            isPercent: true
          },
          { 
            label: "Disposable", 
            value: disposableIncome, 
            icon: Wallet, 
            color: disposableIncome >= 0 ? "text-primary" : "text-red-500",
            bgColor: disposableIncome >= 0 ? "bg-primary/10" : "bg-red-50"
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-white/60 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3", stat.bgColor)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <p className={cn("text-2xl font-semibold", stat.color)}>
                    {stat.isPercent 
                      ? `${stat.value.toFixed(1)}%`
                      : `RM${Math.abs(stat.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                    {!stat.isPercent && stat.value < 0 && (
                      <span className="text-sm ml-1">(deficit)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview", icon: Wallet },
          { id: "bills", label: "Bills & Expenses", icon: Receipt, badge: detectedBills.length },
          { id: "subscriptions", label: "Subscriptions", icon: Repeat },
          { id: "goals", label: "Goals & Debt", icon: Target },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeView === tab.id ? "default" : "outline"}
            onClick={() => setActiveView(tab.id as typeof activeView)}
            className={cn(
              "gap-2 rounded-full",
              activeView === tab.id ? "gradient-accent" : "bg-white/80"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {tab.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {activeView === "overview" && (
            <>
              {/* Income Sources */}
              <Card className="bg-white/60 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Income Sources
                    </CardTitle>
                    <AddTransactionDialog
                      type="income"
                      onAdd={handleAddIncome}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1">
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {budgetData.income.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No income sources added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {budgetData.income.map((income) => (
                        <div
                          key={income.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100"
                        >
                          <div>
                            <p className="font-medium">{income.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {income.frequency}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-green-600">
                              RM{income.amount.toLocaleString()}
                            </span>
                            <EditTransactionDialog
                              type="income"
                              item={income}
                              onSave={(id, name, amount, _, frequency) => 
                                handleEditIncome(id, name, amount, frequency || "monthly")
                              }
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIncome(income.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recurring Expenses */}
              <Card className="bg-white/60 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-red-500" />
                      Recurring Expenses
                    </CardTitle>
                    <AddTransactionDialog
                      type="expense"
                      onAdd={handleAddExpense}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1">
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {budgetData.expenses.filter((e) => e.isRecurring).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recurring expenses added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {budgetData.expenses
                        .filter((e) => e.isRecurring)
                        .map((expense) => {
                          const config = CATEGORY_CONFIG[expense.category];
                          return (
                            <div
                              key={expense.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-white border border-border"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", config.color)}>
                                  <config.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-medium">{expense.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {config.label} • {expense.frequency}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-red-500">
                                  -RM{expense.amount.toLocaleString()}
                                </span>
                                <EditTransactionDialog
                                  type="expense"
                                  item={expense}
                                  onSave={(id, name, amount, category, frequency) => 
                                    handleEditExpense(id, name, amount, category, frequency)
                                  }
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {activeView === "bills" && (
            <Card className="bg-white/60 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Detected Bills from Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detectedBills.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      Upload bills in the Scanner to auto-detect them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detectedBills.map((bill) => (
                      <div
                        key={bill.id}
                        className={cn(
                          "p-4 rounded-xl border",
                          bill.sentiment === "urgent"
                            ? "bg-red-50 border-red-200"
                            : "bg-amber-50 border-amber-200"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{bill.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {bill.summary}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              bill.sentiment === "urgent"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {bill.sentiment}
                          </Badge>
                        </div>
                        {bill.dates.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {bill.dates.map((date, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 rounded-full bg-white border flex items-center gap-1"
                              >
                                <Calendar className="w-3 h-3" />
                                {date.date}: {date.description}
                              </span>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAskAI(`Help me understand this bill: ${bill.name}. ${bill.summary}`)}
                          className="mt-2 text-xs"
                        >
                          <HelpCircle className="w-3 h-3 mr-1" />
                          Explain this bill
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeView === "subscriptions" && (
            <Card className="bg-white/60 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-indigo-500" />
                    Subscriptions
                  </CardTitle>
                  <AddSubscriptionDialog
                    onAdd={handleAddSubscription}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                {budgetData.subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Repeat className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      Track your subscriptions to find savings opportunities
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {budgetData.subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-border"
                      >
                        <div>
                          <p className="font-medium">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Next billing: {sub.nextBillingDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">RM{sub.amount}/{sub.frequency}</p>
                            {sub.canCancel && (
                              <Badge variant="secondary" className="text-xs">
                                Can cancel
                              </Badge>
                            )}
                          </div>
                          <EditSubscriptionDialog
                            subscription={sub}
                            onSave={(id, name, amount, frequency) => 
                              handleEditSubscription(id, name, amount, frequency)
                            }
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubscription(sub.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  onClick={() => onAskAI("Review my subscriptions and suggest which ones I could cancel to save money.")}
                  className="w-full mt-4 text-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI suggestions to reduce subscriptions
                </Button>
              </CardContent>
            </Card>
          )}

          {activeView === "goals" && (
            <>
              {/* Savings Goals */}
              <Card className="bg-white/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      Savings Goals
                    </CardTitle>
                    <AddSavingsGoalDialog
                      onAdd={handleAddSavingsGoal}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1">
                          <Plus className="w-4 h-4" />
                          Add Goal
                        </Button>
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {budgetData.savingsGoals.length === 0 ? (
                    <div className="text-center py-8">
                      <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        Set savings goals to track your progress
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {budgetData.savingsGoals.map((goal) => (
                        <SavingsGoalCard
                          key={goal.id}
                          goal={goal}
                          onUpdate={(updated) => {
                            onUpdateBudget({
                              ...budgetData,
                              savingsGoals: budgetData.savingsGoals.map((g) =>
                                g.id === updated.id ? updated : g
                              ),
                            });
                          }}
                          onDelete={() => {
                            onUpdateBudget({
                              ...budgetData,
                              savingsGoals: budgetData.savingsGoals.filter(
                                (g) => g.id !== goal.id
                              ),
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Debt Overview */}
              {totalDebt > 0 && (
                <Card className="bg-white/60 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-red-500" />
                      Debt Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-red-500">
                        RM{totalDebt.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total debt remaining</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => onAskAI(`I have RM${totalDebt} in debt. Help me create a debt payoff strategy.`)}
                      className="w-full mt-2"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get AI debt payoff plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Affordability Calculator */}
          <AffordabilityCalculator
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses + monthlyDebtPayments + monthlySavings}
            onAskAI={onAskAI}
          />

          {/* Cash Flow Prediction */}
          <Card className="bg-white/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                30-Day Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Projected Income</span>
                  <span className="font-medium text-green-600">
                    +RM{monthlyIncome.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Projected Expenses</span>
                  <span className="font-medium text-red-500">
                    -RM{(monthlyExpenses + monthlyDebtPayments).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Savings Allocation</span>
                  <span className="font-medium text-blue-500">
                    -RM{monthlySavings.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Net Cash Flow</span>
                  <span className={cn(
                    "font-bold",
                    disposableIncome >= 0 ? "text-green-600" : "text-red-500"
                  )}>
                    {disposableIncome >= 0 ? "+" : ""}{disposableIncome.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => onAskAI("Analyze my cash flow and give me tips to improve it.")}
                className="w-full mt-4 text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI cash flow tips
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Quick AI Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Explain tax deductions", icon: FileText },
                { label: "Create a savings plan", icon: PiggyBank },
                { label: "Review my spending", icon: Receipt },
                { label: "Help with bill negotiation", icon: DollarSign },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  onClick={() => onAskAI(action.label)}
                  className="w-full justify-start gap-2 text-sm"
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

