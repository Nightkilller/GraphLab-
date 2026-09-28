import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { Dices } from "lucide-react";
import { useGraphStore } from "@/store/graphStore";
import { generateRandomWeightedGraph } from "@/utils/graph/graphGenerator";

interface AlgorithmHintProps {
  text: string;
  algorithmName: string,
}

export const AlgorithmHint = ({ text, algorithmName }: AlgorithmHintProps) => {
  const prefersReducedMotion = useReducedMotion();

  const handleGenerateRandomWeighted = () => {
    const generated = generateRandomWeightedGraph(6, 1, 15);
    useGraphStore.getState().setGraph(generated.nodes, generated.edges, generated.nodeCounter);
  };

  return (
    <m.div
      layout
      className={cn(
        "fixed z-40 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)]",
        // Mobile: center top
        "top-4",
        // Desktop: below toolbar
        "md:top-[5.5rem]",
      )}
    >
      <m.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, filter: "blur(4px)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative">
        {/* Content layer - persists for width animation */}
        <m.div
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, type: 'spring', bounce: 0.4 }}
          className="relative rounded-md text-sm text-center bg-(--color-surface) text-(--color-text) overflow-hidden flex justify-center items-center"
        >
          <AnimatePresence mode='popLayout' initial={false}>
            <m.span
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, filter: 'blur(1px)', x: '100%' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, filter: 'blur(1px)', x: '-100%' }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, type: 'spring', bounce: 0.2 }}
              key={text}
              className="font-medium z-10 px-4 py-2.5 w-fit whitespace-nowrap flex items-center gap-2.5"
            >
              <span>{text}</span>
              {algorithmName === "dijkstra" && (
                <button
                  type="button"
                  onClick={handleGenerateRandomWeighted}
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-amber-500/15 text-amber-500 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
                  title="Generate a random weighted graph for Dijkstra"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Random Weighted Graph</span>
                </button>
              )}
            </m.span>
          </AnimatePresence>
        </m.div>

        {/* Border layer - remounts on algorithm change for pulse */}
        <AnimatePresence>
          <m.div
            key={algorithmName}
            initial={{ boxShadow: "inset 0 0 0 2px var(--color-accent-form)" }}
            animate={{
              boxShadow: prefersReducedMotion
                ? "inset 0 0 0 2px var(--color-accent-form)"
                : ["inset 0 0 0 2px var(--color-accent-form)", "inset 0 0 0 12px var(--color-accent-form)", "inset 0 0 0 2px var(--color-accent-form)"],
            }}
            transition={{
              boxShadow: {
                duration: prefersReducedMotion ? 0 : 0.6,
                repeat: 1,
                repeatType: 'mirror',
                type: "spring",
                bounce: 0.2,
              },
            }}
            className="absolute inset-0 rounded-md pointer-events-none"
          />
        </AnimatePresence>
      </m.div>
    </m.div>
  );
};
