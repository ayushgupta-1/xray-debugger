"use client";

import { useState } from "react";
import { runDemoPipeline } from "@/lib/demo-logic";
import { Play, Settings2, ArrowRight, Loader2, Terminal } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [maxPrice, setMaxPrice] = useState(50);
  const [minRating, setMinRating] = useState(4.0);

  const handleRun = async () => {
    setIsRunning(true);
    setStatus("idle");
    try {
      await runDemoPipeline({ maxPrice, minRating });
      setStatus("success");
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Base slate */}
        <div className="absolute inset-0 bg-slate-950" />

        {/* Primary blue glow (top-center) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_65%_at_50%_-15%,rgba(37,99,235,0.6),transparent_55%)]" />

        {/* Secondary indigo glow (bottom-center) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_60%_at_50%_115%,rgba(99,102,241,0.5),transparent_55%)]" />

        {/* Side ambient depth (stronger) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_0%_50%,rgba(56,189,248,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_90%_at_100%_50%,rgba(56,189,248,0.25),transparent_60%)]" />

        {/* Strong vignette for contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.98)_100%)]" />
      </div>

      <div className="relative z-10 max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-medium tracking-wide uppercase">
            <Terminal className="w-3 h-3" /> System Trace v1.0
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            X-Ray Debugger
          </h1>
          <p className="text-slate-400">
            Simulate and trace non-deterministic pipelines.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Controls */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">
                <Settings2 className="w-4 h-4" /> Pipeline Configuration
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-slate-400 uppercase">
                      Max Price Filter
                    </label>
                    <span className="text-sm font-mono text-blue-400">
                      ${maxPrice}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-slate-400 uppercase">
                      Min Rating Filter
                    </label>
                    <span className="text-sm font-mono text-blue-400">
                      {minRating} Stars
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            >
              {isRunning ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Play fill="currentColor" />
              )}
              {isRunning ? "Executing Pipeline..." : "Run Simulation"}
            </button>

            {/* Success State */}
            {status === "success" && (
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="text-emerald-400 font-medium text-sm">
                  Trace captured successfully
                </div>
                <Link
                  href="/dashboard"
                  className="text-white text-sm font-bold hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
