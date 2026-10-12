"use client";

import React, { useState, type ComponentType } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewControl } from "@/registry";

export type ControlValues = Record<string, string | number>;

export const defaultValues = (controls: readonly PreviewControl[]): ControlValues =>
  Object.fromEntries(controls.map((control) => [control.key, control.default]));

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

interface PreviewControlsProps {
  controls: readonly PreviewControl[];
  values: ControlValues;
  onChange: (key: string, value: string | number) => void;
  onReset: () => void;
}

/** The live props panel: a variant picker, then one cell per control. */
export function PreviewControls({ controls, values, onChange, onReset }: PreviewControlsProps) {
  const variant = controls.find(
    (control) =>
      control.kind === "choice" && (control.key === "variant" || control.key === "brand"),
  );
  const rest = controls.filter((control) => control !== variant);

  return (
    <div className="space-y-3">
      {variant?.kind === "choice" && (
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {variant.options.length} {variant.key === "brand" ? "brands" : "variants"}
          </p>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={values[variant.key] === option.value}
                onClick={() => onChange(variant.key, option.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  values[variant.key] === option.value
                    ? "border-foreground/30 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="rounded-xl border border-border bg-card/60 p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-sm font-medium text-foreground">Props</p>
            <button
              type="button"
              onClick={onReset}
              title="Reset props"
              aria-label="Reset props"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {rest.map((control) => (
              <ControlCell
                key={control.key}
                control={control}
                value={values[control.key]}
                onChange={(value) => onChange(control.key, value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ControlCell({
  control,
  value,
  onChange,
}: {
  control: PreviewControl;
  value: string | number;
  onChange: (value: string | number) => void;
}) {
  const cell =
    "flex h-10 items-center gap-3 rounded-lg border border-border bg-background/60 px-3 text-xs";
  const label = (
    <span className="w-24 shrink-0 truncate text-muted-foreground">{control.label}</span>
  );

  switch (control.kind) {
    case "range":
      return (
        <label className={cell}>
          {label}
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-1 min-w-0 flex-1 cursor-pointer accent-primary"
          />
          <span className="w-10 shrink-0 text-right font-mono tabular-nums text-foreground">
            {Number(value).toFixed(decimals(control.step))}
          </span>
        </label>
      );
    case "choice":
      return (
        <div className={cell}>
          {label}
          <div className="flex min-w-0 flex-1 justify-end gap-1">
            {control.options.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={value === option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "truncate rounded px-2 py-1 transition-colors",
                  value === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    case "color":
      return (
        <label className={cell}>
          {label}
          <span className="flex-1 text-right font-mono uppercase text-foreground">{value}</span>
          <input
            type="color"
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </label>
      );
    case "text":
      return (
        <label className={cell}>
          {label}
          <input
            type="text"
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-right text-foreground outline-none"
          />
        </label>
      );
  }
}

/**
 * The full-screen preview's stage plus a floating, collapsible controls dock.
 * Control values are passed to the demo, which forwards them to the component.
 */
export function ControlledPreview({
  Demo,
  controls,
  stageClassName,
}: {
  Demo: ComponentType<ControlValues>;
  controls: readonly PreviewControl[];
  stageClassName?: string;
}) {
  const [values, setValues] = useState<ControlValues>(() => defaultValues(controls));
  const [open, setOpen] = useState(true);

  return (
    <>
      <div className={stageClassName} data-preview-stage>
        <Demo {...values} />
      </div>
      <aside className="fixed bottom-4 right-4 z-50 flex max-h-[calc(100vh-2rem)] w-[min(360px,calc(100vw-2rem))] flex-col rounded-xl border border-border bg-background/85 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground"
        >
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-left">Controls</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform motion-reduce:transition-none",
              !open && "rotate-180",
            )}
          />
        </button>
        {open && (
          <div className="no-scrollbar min-h-0 overflow-y-auto px-3 pb-3">
            <PreviewControls
              controls={controls}
              values={values}
              onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
              onReset={() => setValues(defaultValues(controls))}
            />
          </div>
        )}
      </aside>
    </>
  );
}
