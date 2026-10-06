"use client";

import React, { useState, useRef, useLayoutEffect, Children } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProcessStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  disableStepIndicators?: boolean;
}

export function ProcessStepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  disableStepIndicators = false,
  className,
  ...rest
}: ProcessStepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);

  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm",
        className,
      )}
      {...rest}
    >
      <div className="flex w-full items-center p-8">
        {stepsArray.map((_, index) => {
          const stepNumber = index + 1;
          const isNotLastStep = index < totalSteps - 1;

          return (
            <React.Fragment key={stepNumber}>
              <StepIndicator
                step={stepNumber}
                disableStepIndicators={disableStepIndicators}
                currentStep={currentStep}
                onClickStep={(clicked: number) => {
                  setDirection(clicked > currentStep ? 1 : -1);
                  updateStep(clicked);
                }}
              />
              {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
            </React.Fragment>
          );
        })}
      </div>

      <StepContentWrapper
        isCompleted={isCompleted}
        currentStep={currentStep}
        direction={direction}
        className="space-y-4 px-8"
      >
        {stepsArray[currentStep - 1]}
      </StepContentWrapper>

      {!isCompleted && (
        <div className="px-8 pb-8 pt-4">
          <div className={cn("mt-6 flex", currentStep !== 1 ? "justify-between" : "justify-end")}>
            {currentStep !== 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {backButtonText}
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              className="flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {isLastStep ? "Complete" : nextButtonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepContentWrapper({ isCompleted, currentStep, direction, children, className }: any) {
  const [parentHeight, setParentHeight] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", duration: 0.4 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition
            key={currentStep}
            direction={direction}
            reduced={!!prefersReducedMotion}
            onHeightReady={(h: number) => setParentHeight(h)}
          >
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({ children, direction, reduced, onHeightReady }: any) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={{
        // Reduced motion: a short opacity-only crossfade instead of a slide.
        enter: (dir) => ({ x: reduced ? "0%" : dir >= 0 ? "-100%" : "100%", opacity: 0 }),
        center: { x: "0%", opacity: 1 },
        exit: (dir) => ({ x: reduced ? "0%" : dir >= 0 ? "50%" : "-50%", opacity: 0 }),
      }}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: reduced ? 0.15 : 0.4 }}
      style={{ position: "absolute", left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function Step({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }: any) {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";
  const prefersReducedMotion = useReducedMotion();

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };

  return (
    <motion.div
      onClick={handleClick}
      className={cn(
        "relative flex-shrink-0 outline-none focus:outline-none",
        disableStepIndicators ? "pointer-events-none opacity-50" : "cursor-pointer",
      )}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: {
            scale: 1,
            backgroundColor: "hsl(var(--muted))",
            color: "hsl(var(--muted-foreground))",
          },
          active: {
            scale: 1,
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          },
          complete: {
            scale: 1,
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          },
        }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent font-semibold"
      >
        {status === "complete" ? (
          <CheckIcon className="h-5 w-5 text-primary-foreground" />
        ) : status === "active" ? (
          <div className="h-3 w-3 rounded-full bg-primary-foreground" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="relative mx-3 h-1 flex-1 overflow-hidden rounded-full bg-muted">
      <motion.div
        className="absolute left-0 top-0 h-full bg-primary"
        initial={false}
        animate={{ width: isComplete ? "100%" : "0%" }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
      />
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <motion.path
        initial={prefersReducedMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: "tween", ease: "easeOut", duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
