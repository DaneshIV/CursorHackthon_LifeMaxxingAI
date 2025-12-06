"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  AlertTriangle,
  Trophy,
  Sparkles,
  Calendar,
  Star,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DocumentInsight } from "@/app/page";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface QuestTrackerProps {
  insights: DocumentInsight[];
  completedTasks: string[];
  onToggleTask: (taskId: string) => void;
  visitorId: string;
}

interface Task {
  id: string;
  text: string;
  documentName: string;
  dueDate?: string;
  urgency: "urgent" | "important" | "normal";
  type: "action" | "date" | "step";
}

// Pixel art character SVG - different states based on progress
const PixelCharacter = ({ progress, level }: { progress: number; level: number }) => {
  const getCharacterState = () => {
    if (progress === 100) return "celebrating";
    if (progress >= 75) return "excited";
    if (progress >= 50) return "happy";
    if (progress >= 25) return "determined";
    return "idle";
  };

  const state = getCharacterState();

  return (
    <div className="relative">
      {/* Character Container */}
      <motion.div
        animate={
          state === "celebrating"
            ? { y: [0, -8, 0], rotate: [0, 5, -5, 0] }
            : state === "excited"
            ? { y: [0, -4, 0] }
            : { y: [0, -2, 0] }
        }
        transition={{
          duration: state === "celebrating" ? 0.5 : 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {/* Pixel Art Character */}
        <svg
          width="80"
          height="96"
          viewBox="0 0 20 24"
          className="pixelated"
          style={{ imageRendering: "pixelated" }}
        >
          {/* Hair */}
          <rect x="6" y="1" width="8" height="1" fill="#4A3728" />
          <rect x="5" y="2" width="10" height="1" fill="#4A3728" />
          <rect x="5" y="3" width="10" height="2" fill="#4A3728" />
          
          {/* Face */}
          <rect x="6" y="5" width="8" height="1" fill="#FFD5B8" />
          <rect x="5" y="6" width="10" height="4" fill="#FFD5B8" />
          
          {/* Eyes */}
          <rect x="7" y="7" width="2" height="2" fill="#2D2A26" />
          <rect x="11" y="7" width="2" height="2" fill="#2D2A26" />
          {/* Eye shine */}
          <rect x="7" y="7" width="1" height="1" fill="#FFFFFF" />
          <rect x="11" y="7" width="1" height="1" fill="#FFFFFF" />
          
          {/* Mouth - changes with state */}
          {state === "celebrating" || state === "excited" ? (
            <>
              <rect x="8" y="9" width="4" height="1" fill="#E8936E" />
              <rect x="9" y="10" width="2" height="1" fill="#E8936E" />
            </>
          ) : state === "happy" ? (
            <rect x="8" y="9" width="4" height="1" fill="#E8936E" />
          ) : (
            <rect x="9" y="9" width="2" height="1" fill="#C4654A" />
          )}
          
          {/* Body/Shirt */}
          <rect x="6" y="11" width="8" height="1" fill="#C4654A" />
          <rect x="5" y="12" width="10" height="4" fill="#C4654A" />
          
          {/* Arms */}
          {state === "celebrating" ? (
            <>
              <rect x="3" y="11" width="2" height="1" fill="#FFD5B8" />
              <rect x="2" y="10" width="2" height="1" fill="#FFD5B8" />
              <rect x="15" y="11" width="2" height="1" fill="#FFD5B8" />
              <rect x="16" y="10" width="2" height="1" fill="#FFD5B8" />
            </>
          ) : (
            <>
              <rect x="3" y="12" width="2" height="3" fill="#FFD5B8" />
              <rect x="15" y="12" width="2" height="3" fill="#FFD5B8" />
            </>
          )}
          
          {/* Belt */}
          <rect x="5" y="16" width="10" height="1" fill="#E8B94A" />
          
          {/* Pants */}
          <rect x="6" y="17" width="8" height="3" fill="#5B8C6E" />
          <rect x="6" y="20" width="3" height="2" fill="#5B8C6E" />
          <rect x="11" y="20" width="3" height="2" fill="#5B8C6E" />
          
          {/* Shoes */}
          <rect x="5" y="22" width="4" height="2" fill="#4A3728" />
          <rect x="11" y="22" width="4" height="2" fill="#4A3728" />
        </svg>

        {/* Level badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-amber-300"
        >
          {level}
        </motion.div>
      </motion.div>

      {/* Celebration particles */}
      {state === "celebrating" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [40, 40 + (Math.random() - 0.5) * 60],
                y: [48, 48 - 40 - Math.random() * 30],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// XP Bar component
const XPBar = ({ progress, xp, xpToNext }: { progress: number; xp: number; xpToNext: number }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">XP</span>
        <span className="font-mono text-primary">{xp} / {xpToNext}</span>
      </div>
      <div className="h-4 bg-secondary rounded-sm overflow-hidden border-2 border-border relative">
        {/* Pixel segments */}
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Pixel grid overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "linear-gradient(90deg, transparent 75%, rgba(0,0,0,0.3) 75%)",
            backgroundSize: "4px 100%",
          }}
        />
      </div>
    </div>
  );
};

export function QuestTracker({ insights, completedTasks, onToggleTask, visitorId }: QuestTrackerProps) {
  // Get quest progress from Convex
  const questProgress = useQuery(
    api.quests.getQuestProgress,
    visitorId ? { visitorId } : "skip"
  );

  // Extract all tasks from insights
  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    
    insights.forEach((insight) => {
      // Add action items
      insight.actionItems.forEach((item, i) => {
        tasks.push({
          id: `${insight.id}-action-${i}`,
          text: item,
          documentName: insight.fileName,
          urgency: insight.sentiment === "urgent" ? "urgent" : insight.sentiment === "important" ? "important" : "normal",
          type: "action",
        });
      });
      
      // Add important dates as tasks
      insight.importantDates.forEach((date, i) => {
        tasks.push({
          id: `${insight.id}-date-${i}`,
          text: `${date.date}: ${date.description}`,
          documentName: insight.fileName,
          dueDate: date.date,
          urgency: insight.sentiment === "urgent" ? "urgent" : "important",
          type: "date",
        });
      });
      
      // Add next steps
      insight.nextSteps.forEach((step, i) => {
        tasks.push({
          id: `${insight.id}-step-${i}`,
          text: step,
          documentName: insight.fileName,
          urgency: "normal",
          type: "step",
        });
      });
    });
    
    return tasks;
  }, [insights]);

  // Calculate progress and level from Convex data
  const completedCount = completedTasks.length;
  const totalTasks = allTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  
  // XP system from Convex
  const xp = questProgress?.xp ?? 0;
  const level = questProgress?.level ?? 1;
  const xpInCurrentLevel = xp % 100;
  const xpToNextLevel = 100;
  const xpProgress = (xpInCurrentLevel / xpToNextLevel) * 100;

  // Sort tasks: urgent first, then important, then by completion status
  const sortedTasks = useMemo(() => {
    return [...allTasks].sort((a, b) => {
      const aCompleted = completedTasks.includes(a.id);
      const bCompleted = completedTasks.includes(b.id);
      
      // Completed tasks go to bottom
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      
      // Then by urgency
      const urgencyOrder = { urgent: 0, important: 1, normal: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [allTasks, completedTasks]);

  const urgentTasks = sortedTasks.filter(t => t.urgency === "urgent" && !completedTasks.includes(t.id));
  const importantTasks = sortedTasks.filter(t => t.urgency === "important" && !completedTasks.includes(t.id));

  if (totalTasks === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-border/50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-secondary/50 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h4 className="font-medium mb-1">No quests yet!</h4>
            <p className="text-sm text-muted-foreground">
              Upload documents to unlock your adulting quests
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/80 to-primary/5 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Quest Log
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {completedCount}/{totalTasks} complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Character and Progress Section */}
        <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border/50">
          <PixelCharacter progress={progress} level={level} />
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-lg">Level {level}</span>
                <span className="text-sm text-muted-foreground">
                  {progress === 100 ? "Adulting Master!" : 
                   progress >= 75 ? "Almost There!" :
                   progress >= 50 ? "Making Progress!" :
                   progress >= 25 ? "Getting Started!" :
                   "New Adventurer"}
                </span>
              </div>
              <XPBar progress={xpProgress} xp={xpInCurrentLevel} xpToNext={xpToNextLevel} />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/60">
                <div className="text-lg font-bold text-red-500">{urgentTasks.length}</div>
                <div className="text-xs text-muted-foreground">Urgent</div>
              </div>
              <div className="p-2 rounded-lg bg-white/60">
                <div className="text-lg font-bold text-amber-500">{importantTasks.length}</div>
                <div className="text-xs text-muted-foreground">Important</div>
              </div>
              <div className="p-2 rounded-lg bg-white/60">
                <div className="text-lg font-bold text-green-500">{completedCount}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quest Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-6 bg-secondary rounded-lg overflow-hidden border-2 border-border relative">
            <motion.div
              className="h-full relative"
              style={{
                background: "linear-gradient(90deg, #C4654A 0%, #E8B94A 50%, #5B8C6E 100%)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.div>
            {/* Pixel segments */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "linear-gradient(90deg, transparent 87.5%, rgba(0,0,0,0.5) 87.5%)",
                backgroundSize: "8px 100%",
              }}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          <AnimatePresence>
            {sortedTasks.slice(0, 10).map((task, i) => {
              const isCompleted = completedTasks.includes(task.id);
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                      isCompleted 
                        ? "bg-green-50 border border-green-200" 
                        : task.urgency === "urgent"
                        ? "bg-red-50 border border-red-200 hover:bg-red-100"
                        : task.urgency === "important"
                        ? "bg-amber-50 border border-amber-200 hover:bg-amber-100"
                        : "bg-white/60 border border-border hover:bg-white"
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : task.urgency === "urgent"
                          ? "border-red-400"
                          : task.urgency === "important"
                          ? "border-amber-400"
                          : "border-border"
                      )}
                    >
                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        isCompleted && "line-through text-muted-foreground"
                      )}>
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground truncate">
                          {task.documentName}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Urgency indicator */}
                    {!isCompleted && (
                      <div className="flex-shrink-0">
                        {task.urgency === "urgent" && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        {task.urgency === "important" && (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    )}
                    
                    {/* XP reward */}
                    {!isCompleted && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        +10 XP
                      </span>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {sortedTasks.length > 10 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              +{sortedTasks.length - 10} more quests...
            </p>
          )}
        </div>

        {/* Completion celebration */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-100 to-green-100 border border-amber-200 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-700">All Quests Complete!</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-sm text-amber-600">
              You&apos;ve conquered your adulting tasks. You&apos;re officially a pro! 🎉
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

