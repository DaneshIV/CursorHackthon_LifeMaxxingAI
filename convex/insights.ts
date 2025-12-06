import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all document insights for a visitor
export const getInsights = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("documentInsights")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .order("desc")
      .collect();
    return insights;
  },
});

// Add a new document insight
export const addInsight = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const insightId = await ctx.db.insert("documentInsights", {
      visitorId: args.visitorId,
      fileName: args.fileName,
      fileType: args.fileType,
      summary: args.summary,
      actionItems: args.actionItems,
      importantDates: args.importantDates,
      sentiment: args.sentiment,
      category: args.category,
      recommendations: args.recommendations,
      analyzedAt: args.analyzedAt,
    });
    return insightId;
  },
});

// Delete an insight
export const deleteInsight = mutation({
  args: { id: v.id("documentInsights") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Clear all insights for a visitor
export const clearInsights = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const insights = await ctx.db
      .query("documentInsights")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();
    
    for (const insight of insights) {
      await ctx.db.delete(insight._id);
    }
    
    return { deleted: insights.length };
  },
});

