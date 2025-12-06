import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default budget data structure
const defaultBudgetData = {
  income: [],
  expenses: [],
  subscriptions: [],
  savingsGoals: [],
  debts: [],
};

// Get budget data for a visitor
export const getBudgetData = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const budget = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();
    
    return budget || { ...defaultBudgetData, visitorId: args.visitorId };
  },
});

// Initialize or update entire budget data
export const setBudgetData = mutation({
  args: {
    visitorId: v.string(),
    income: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        amount: v.number(),
        frequency: v.string(),
        nextPayDate: v.optional(v.string()),
      })
    ),
    expenses: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        amount: v.number(),
        category: v.string(),
        isRecurring: v.boolean(),
        frequency: v.optional(v.string()),
        dueDate: v.optional(v.string()),
      })
    ),
    subscriptions: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        amount: v.number(),
        frequency: v.string(),
        nextBillingDate: v.string(),
        canCancel: v.boolean(),
        category: v.optional(v.string()),
      })
    ),
    savingsGoals: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        targetAmount: v.number(),
        currentAmount: v.number(),
        targetDate: v.string(),
        monthlyContribution: v.number(),
      })
    ),
    debts: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        totalAmount: v.number(),
        remainingAmount: v.number(),
        interestRate: v.number(),
        minimumPayment: v.number(),
        dueDate: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        income: args.income,
        expenses: args.expenses,
        subscriptions: args.subscriptions,
        savingsGoals: args.savingsGoals,
        debts: args.debts,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("budgetData", args);
    }
  },
});

// Add a subscription
export const addSubscription = mutation({
  args: {
    visitorId: v.string(),
    subscription: v.object({
      id: v.string(),
      name: v.string(),
      amount: v.number(),
      frequency: v.string(),
      nextBillingDate: v.string(),
      canCancel: v.boolean(),
      category: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        subscriptions: [...existing.subscriptions, args.subscription],
      });
    } else {
      await ctx.db.insert("budgetData", {
        visitorId: args.visitorId,
        ...defaultBudgetData,
        subscriptions: [args.subscription],
      });
    }
  },
});

// Add an expense
export const addExpense = mutation({
  args: {
    visitorId: v.string(),
    expense: v.object({
      id: v.string(),
      name: v.string(),
      amount: v.number(),
      category: v.string(),
      isRecurring: v.boolean(),
      frequency: v.optional(v.string()),
      dueDate: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        expenses: [...existing.expenses, args.expense],
      });
    } else {
      await ctx.db.insert("budgetData", {
        visitorId: args.visitorId,
        ...defaultBudgetData,
        expenses: [args.expense],
      });
    }
  },
});

// Add income
export const addIncome = mutation({
  args: {
    visitorId: v.string(),
    income: v.object({
      id: v.string(),
      name: v.string(),
      amount: v.number(),
      frequency: v.string(),
      nextPayDate: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        income: [...existing.income, args.income],
      });
    } else {
      await ctx.db.insert("budgetData", {
        visitorId: args.visitorId,
        ...defaultBudgetData,
        income: [args.income],
      });
    }
  },
});

// Add savings goal
export const addSavingsGoal = mutation({
  args: {
    visitorId: v.string(),
    goal: v.object({
      id: v.string(),
      name: v.string(),
      targetAmount: v.number(),
      currentAmount: v.number(),
      targetDate: v.string(),
      monthlyContribution: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        savingsGoals: [...existing.savingsGoals, args.goal],
      });
    } else {
      await ctx.db.insert("budgetData", {
        visitorId: args.visitorId,
        ...defaultBudgetData,
        savingsGoals: [args.goal],
      });
    }
  },
});

// Add debt
export const addDebt = mutation({
  args: {
    visitorId: v.string(),
    debt: v.object({
      id: v.string(),
      name: v.string(),
      totalAmount: v.number(),
      remainingAmount: v.number(),
      interestRate: v.number(),
      minimumPayment: v.number(),
      dueDate: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        debts: [...existing.debts, args.debt],
      });
    } else {
      await ctx.db.insert("budgetData", {
        visitorId: args.visitorId,
        ...defaultBudgetData,
        debts: [args.debt],
      });
    }
  },
});

// Delete a subscription
export const deleteSubscription = mutation({
  args: {
    visitorId: v.string(),
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        subscriptions: existing.subscriptions.filter(
          (s) => s.id !== args.subscriptionId
        ),
      });
    }
  },
});

// Delete an expense
export const deleteExpense = mutation({
  args: {
    visitorId: v.string(),
    expenseId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        expenses: existing.expenses.filter((e) => e.id !== args.expenseId),
      });
    }
  },
});

// Delete income
export const deleteIncome = mutation({
  args: {
    visitorId: v.string(),
    incomeId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("budgetData")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        income: existing.income.filter((i) => i.id !== args.incomeId),
      });
    }
  },
});

