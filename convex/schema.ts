import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Chat messages
  chatMessages: defineTable({
    visitorId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    detectedBudgetItems: v.optional(
      v.array(
        v.object({
          type: v.string(),
          name: v.string(),
          amount: v.number(),
          frequency: v.string(),
          category: v.optional(v.string()),
        })
      )
    ),
  }).index("by_visitor", ["visitorId"]),

  // Document insights from scanned documents
  documentInsights: defineTable({
    visitorId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    summary: v.string(),
    actionItems: v.array(v.string()),
    importantDates: v.array(
      v.object({
        date: v.string(),
        description: v.string(),
      })
    ),
    sentiment: v.string(),
    category: v.string(),
    recommendations: v.array(v.string()),
    analyzedAt: v.string(),
  }).index("by_visitor", ["visitorId"]),

  // Budget data
  budgetData: defineTable({
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
  }).index("by_visitor", ["visitorId"]),

  // Quest tracker - completed tasks and XP
  questProgress: defineTable({
    visitorId: v.string(),
    completedTasks: v.array(v.string()),
    xp: v.number(),
    level: v.number(),
  }).index("by_visitor", ["visitorId"]),

  // User preferences (for future use)
  userPreferences: defineTable({
    visitorId: v.string(),
    hasCompletedOnboarding: v.boolean(),
    theme: v.optional(v.string()),
    currency: v.optional(v.string()),
  }).index("by_visitor", ["visitorId"]),

  // Character customization
  characterCustomization: defineTable({
    visitorId: v.string(),
    skinTone: v.string(),
    hairColor: v.string(),
    hairStyle: v.string(),
    shirtColor: v.string(),
    pantsColor: v.string(),
    shoeColor: v.string(),
    accessory: v.optional(v.string()),
    bodyStyle: v.optional(v.string()), // Optional for backwards compatibility
  }).index("by_visitor", ["visitorId"]),
});

