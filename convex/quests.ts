import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get quest progress for a visitor
export const getQuestProgress = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("questProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();
    
    return progress || {
      visitorId: args.visitorId,
      completedTasks: [],
      xp: 0,
      level: 1,
    };
  },
});

// Toggle a task completion
export const toggleTask = mutation({
  args: {
    visitorId: v.string(),
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("questProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      const isCompleted = existing.completedTasks.includes(args.taskId);
      let newXp = existing.xp;
      let newLevel = existing.level;
      
      if (!isCompleted) {
        // Task completed - add XP
        newXp += 25;
        // Check for level up (every 100 XP)
        if (newXp >= existing.level * 100) {
          newLevel += 1;
        }
      } else {
        // Task uncompleted - remove XP (but don't go below 0)
        newXp = Math.max(0, newXp - 25);
      }

      await ctx.db.patch(existing._id, {
        completedTasks: isCompleted
          ? existing.completedTasks.filter((id) => id !== args.taskId)
          : [...existing.completedTasks, args.taskId],
        xp: newXp,
        level: newLevel,
      });
      
      return { isNowCompleted: !isCompleted, xp: newXp, level: newLevel };
    } else {
      // First task completion
      await ctx.db.insert("questProgress", {
        visitorId: args.visitorId,
        completedTasks: [args.taskId],
        xp: 25,
        level: 1,
      });
      return { isNowCompleted: true, xp: 25, level: 1 };
    }
  },
});

// Update XP and level directly
export const updateProgress = mutation({
  args: {
    visitorId: v.string(),
    xp: v.number(),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("questProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        xp: args.xp,
        level: args.level,
      });
    } else {
      await ctx.db.insert("questProgress", {
        visitorId: args.visitorId,
        completedTasks: [],
        xp: args.xp,
        level: args.level,
      });
    }
  },
});

// Reset quest progress
export const resetProgress = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("questProgress")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completedTasks: [],
        xp: 0,
        level: 1,
      });
    }
  },
});

// Character customization
export const getCharacterCustomization = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const customization = await ctx.db
      .query("characterCustomization")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();
    
    // Return defaults if no customization exists
    return customization || {
      visitorId: args.visitorId,
      skinTone: "#FFD5B8",
      hairColor: "#4A3728",
      hairStyle: "short",
      shirtColor: "#C4654A",
      pantsColor: "#5B8C6E",
      shoeColor: "#4A3728",
      accessory: undefined,
      bodyStyle: "masculine",
    };
  },
});

export const updateCharacterCustomization = mutation({
  args: {
    visitorId: v.string(),
    skinTone: v.string(),
    hairColor: v.string(),
    hairStyle: v.string(),
    shirtColor: v.string(),
    pantsColor: v.string(),
    shoeColor: v.string(),
    accessory: v.optional(v.string()),
    bodyStyle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("characterCustomization")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        skinTone: args.skinTone,
        hairColor: args.hairColor,
        hairStyle: args.hairStyle,
        shirtColor: args.shirtColor,
        pantsColor: args.pantsColor,
        shoeColor: args.shoeColor,
        accessory: args.accessory,
        bodyStyle: args.bodyStyle,
      });
    } else {
      await ctx.db.insert("characterCustomization", args);
    }
  },
});

