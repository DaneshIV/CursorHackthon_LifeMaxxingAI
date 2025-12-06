import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user preferences
export const getPreferences = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();
    
    return prefs || {
      visitorId: args.visitorId,
      hasCompletedOnboarding: false,
      theme: "light",
      currency: "RM",
    };
  },
});

// Complete onboarding
export const completeOnboarding = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        hasCompletedOnboarding: true,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        visitorId: args.visitorId,
        hasCompletedOnboarding: true,
        theme: "light",
        currency: "RM",
      });
    }
  },
});

// Update preferences
export const updatePreferences = mutation({
  args: {
    visitorId: v.string(),
    theme: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    const updates: Record<string, string> = {};
    if (args.theme) updates.theme = args.theme;
    if (args.currency) updates.currency = args.currency;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("userPreferences", {
        visitorId: args.visitorId,
        hasCompletedOnboarding: false,
        ...updates,
      });
    }
  },
});

// Reset onboarding (for testing)
export const resetOnboarding = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        hasCompletedOnboarding: false,
      });
    }
  },
});

