import { LazyMotion, domMax } from "motion/react";
import { Board } from "./components/Board/Board";
import { Toaster } from "sonner";
import { useApplyTheme } from "@/theme";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function AppErrorFallback({ error }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error || "An unexpected error occurred.");
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 p-8 text-center bg-(--color-paper) text-(--color-text)">
      <AlertTriangle className="w-12 h-12 text-(--color-accent)" />
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-sm text-(--color-text-muted) max-w-md">
        {errorMessage}
      </p>
      <Button
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        variant="outline"
        className="gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset & Reload
      </Button>
    </div>
  );
}

function App() {
  // Initialize theme system (applies data-theme attribute to document)
  useApplyTheme();

  return (
    <LazyMotion features={domMax} strict>
      <ErrorBoundary FallbackComponent={AppErrorFallback}>
        <Board />
      </ErrorBoundary>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-text)",
            border: "none",
            borderRadius: "8px",
            boxShadow: "var(--shadow-raised-lg)",
            fontFamily: "var(--font-sans)",
            color: "var(--color-surface)",
          },
        }}
      />
      <SpeedInsights />
    </LazyMotion>
  );
}

export default App;
