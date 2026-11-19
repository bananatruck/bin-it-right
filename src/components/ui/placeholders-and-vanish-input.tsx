// Source: Aceternity UI, https://ui.aceternity.com/registry/placeholders-and-vanish-input.json
// License and copyright notice: THIRD_PARTY_NOTICES.md at the repository root.
"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RawPixel {
  x: number;
  y: number;
  color: [number, number, number, number];
}

interface AnimatedPixel {
  x: number;
  y: number;
  r: number;
  color: string;
}

/**
 * Supports both controlled (`value` + `onValueChange`) and uncontrolled
 * (`initialValue` + `onChange`) input modes.
 */
export interface PlaceholdersAndVanishInputProps {
  placeholders: string[];
  onChange?: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  value?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  initialValue?: string | undefined;
  id?: string | undefined;
  "aria-label"?: string | undefined;
  /** Bin It Right: accessible name of the submit button, so it can be translated. */
  submitLabel?: string | undefined;
}

function prefersReducedMotionQuery(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  value: controlledValue,
  onValueChange,
  initialValue = "",
  id,
  "aria-label": ariaLabel,
  submitLabel = "Search",
}: PlaceholdersAndVanishInputProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const framerReducedMotion = useReducedMotion();
  const shouldReduceMotion =
    Boolean(framerReducedMotion) || prefersReducedMotionQuery();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (shouldReduceMotion || placeholders.length <= 1) {
      return;
    }

    const startAnimation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
      }, 3000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (document.visibilityState === "visible") {
        startAnimation();
      }
    };

    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders, shouldReduceMotion]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<AnimatedPixel[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(initialValue);
  const [animating, setAnimating] = useState(false);
  // Bin It Right: each vanish animation gets a number; typing starts a new number, which cancels the
  // running animation, so a quick next search is never dropped while the old text dissolves.
  const runRef = useRef(0);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const updateValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange]
  );

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null;
    try {
      ctx = canvas.getContext("2d", { willReadFrequently: true });
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: RawPixel[] = [];

    for (let t = 0; t < 800; t++) {
      const i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        const e = i + 4 * n;
        const r = pixelData[e] ?? 0;
        const g = pixelData[e + 1] ?? 0;
        const b = pixelData[e + 2] ?? 0;
        const a = pixelData[e + 3] ?? 0;
        if (r !== 0 && g !== 0 && b !== 0) {
          newData.push({
            x: n,
            y: t,
            color: [r, g, b, a],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  // Bin It Right: the text is rasterised only in vanishAndSubmit. Redrawing on every keystroke scanned an
  // 800 by 800 canvas per change, and the redraw after the app clears the field erased the particles.

  const animate = (start: number) => {
    const run = ++runRef.current;
    const animateFrame = (pos = 0) => {
      requestAnimationFrame(() => {
        if (run !== runRef.current) return;
        const newArr: AnimatedPixel[] = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (!current) continue;
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          updateValue("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const vanishAndSubmit = () => {
    if (shouldReduceMotion || prefersReducedMotionQuery()) {
      setAnimating(false);
      return;
    }

    setAnimating(true);
    draw();

    const currentVal = inputRef.current?.value ?? "";
    if (currentVal && inputRef.current) {
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      if (newDataRef.current.length > 0) {
        animate(maxX);
      } else {
        setAnimating(false);
      }
    } else {
      setAnimating(false);
    }
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    vanishAndSubmit();
    onSubmit(e);
  };

  return (
    <form
      className={cn(
        "w-full relative bg-white h-14 rounded-full overflow-hidden border-[1.5px] border-[#0e2a3b] focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-[#1d5fd1] transition duration-200",
        value && "bg-gray-50"
      )}
      onSubmit={handleSubmit}
    >
      <canvas
        className={cn(
          "absolute pointer-events-none text-base transform scale-50 top-[20%] left-4 origin-top-left filter invert dark:invert-0 pr-20",
          !animating ? "opacity-0" : "opacity-100"
        )}
        ref={canvasRef}
      />
      <input
        id={id}
        aria-label={ariaLabel}
        onChange={(e) => {
          if (animating) {
            runRef.current++;
            newDataRef.current = [];
            canvasRef.current?.getContext("2d", { willReadFrequently: true })?.clearRect(0, 0, 800, 800);
            setAnimating(false);
          }
          updateValue(e.target.value);
          onChange?.(e);
        }}
        ref={inputRef}
        value={value}
        type="text"
        className={cn(
          "w-full relative text-[1.0625rem] z-50 border-none dark:text-white bg-transparent text-black h-full rounded-full focus:outline-none focus:ring-0 pl-6 pr-20",
          animating && "text-transparent dark:text-transparent"
        )}
      />

      <button
        aria-label={submitLabel}
        disabled={!value}
        type="submit"
        className="absolute right-0 top-1/2 z-50 -translate-y-1/2 h-12 w-12 min-h-[48px] min-w-[48px] rounded-full disabled:bg-gray-100 bg-black dark:bg-zinc-900 dark:disabled:bg-zinc-800 transition duration-200 flex items-center justify-center"
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-300 h-4 w-4"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l14 0"
            initial={{
              strokeDasharray: "50%",
              strokeDashoffset: "50%",
            }}
            animate={{
              strokeDashoffset: value ? 0 : "50%",
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.3,
              ease: "linear",
            }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>

      <div aria-hidden="true" className="absolute inset-0 flex items-center rounded-full pointer-events-none">
        {shouldReduceMotion ? (
          !value && (
            <p className="dark:text-zinc-500 text-[1.0625rem] font-normal text-neutral-500 pl-6 text-left w-[calc(100%-2rem)] truncate">
              {placeholders[currentPlaceholder] ?? ""}
            </p>
          )
        ) : (
          <AnimatePresence mode="wait">
            {!value && (
              <motion.p
                initial={{
                  y: 5,
                  opacity: 0,
                }}
                key={`current-placeholder-${currentPlaceholder}`}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                exit={{
                  y: -15,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: "linear",
                }}
                className="dark:text-zinc-500 text-[1.0625rem] font-normal text-neutral-500 pl-6 text-left w-[calc(100%-2rem)] truncate"
              >
                {placeholders[currentPlaceholder] ?? ""}
              </motion.p>
            )}
          </AnimatePresence>
        )}
      </div>
    </form>
  );
}
