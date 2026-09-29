"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const PHASE_NAMES = ["Phase 0", "Phase 1", "Phase 2", "Phase 3", "Capstone"];

interface PhaseBarProps {
  phaseCount: number;
  modulesPerPhase: number[];
  currentPhase?: number;
  size?: "sm" | "md";
}

export function PhaseBar({ phaseCount, modulesPerPhase, currentPhase, size = "md" }: PhaseBarProps) {
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const labelClass = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {Array.from({ length: phaseCount }, (_, i) => {
            const hasModules = (modulesPerPhase[i] || 0) > 0;
            const isCurrent = currentPhase !== undefined && i === currentPhase;
            const name = PHASE_NAMES[i] || `Phase ${i}`;
            const count = modulesPerPhase[i] || 0;

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "rounded-full border transition-colors cursor-default",
                      dotSize,
                      isCurrent && "border-primary bg-primary ring-1 ring-primary/30",
                      !isCurrent && hasModules && "border-primary bg-primary",
                      !isCurrent && !hasModules && "border-border bg-transparent"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{name} &mdash; {count} module{count !== 1 ? "s" : ""}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className={cn("flex justify-between text-muted-foreground", labelClass)}>
          {Array.from({ length: phaseCount }, (_, i) => (
            <span key={i} className="min-w-[3rem] text-center">
              {modulesPerPhase[i] || 0}
            </span>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}


