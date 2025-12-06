import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all chat messages for a visitor
export const getMessages = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .order("asc")
      .collect();
    return messages;
  },
});

// Add a new chat message
export const addMessage = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatMessages", {
      visitorId: args.visitorId,
      role: args.role,
      content: args.content,
      timestamp: args.timestamp,
      detectedBudgetItems: args.detectedBudgetItems,
    });
    return messageId;
  },
});

// Clear all messages for a visitor (for "New Chat" functionality)
export const clearMessages = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    return { deleted: messages.length };
  },
});

