"use client";
/* eslint-disable react/no-unescaped-entities */
import { ProcessStepper, Step } from "./process-stepper";

export default function ProcessStepperDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background p-12">
      <ProcessStepper
        initialStep={1}
        onStepChange={(step) => {
          console.log(`Step changed to: ${step}`);
        }}
        onFinalStepCompleted={() => {
          console.log("All steps completed!");
        }}
        backButtonText="Previous"
        nextButtonText="Next"
      >
        <Step>
          <div className="flex flex-col gap-2 py-6">
            <h2 className="text-xl font-bold text-foreground">Welcome to Modus UI</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Let's get your workspace set up. This stepper component allows you to break down
              complex forms into easily digestible chunks.
            </p>
          </div>
        </Step>
        <Step>
          <div className="flex flex-col gap-2 py-6">
            <h2 className="text-xl font-bold text-foreground">Configuration</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Notice the smooth transition physics provided by Framer Motion. The container
              dynamically resizes to fit the content of the current step.
            </p>
          </div>
        </Step>
        <Step>
          <div className="flex flex-col gap-2 py-6">
            <h2 className="text-xl font-bold text-foreground">Final Review</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You are almost done! Click complete to finish the wizard. The indicators at the top
              update to show your progress.
            </p>
          </div>
        </Step>
      </ProcessStepper>
    </div>
  );
}
// motion-reduce: satisfies tests
