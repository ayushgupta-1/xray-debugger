"use client";

import { useState } from "react";
import { runDemoPipeline } from "@/lib/demo-logic"; // Ensure this path matches your file structure
import { Play, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setStatus("idle");
    try {
      await runDemoPipeline();
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-black">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4">
          X-Ray Debugging System
        </p>
      </div>

      <div className="relative flex place-items-center flex-col gap-8 mt-16">
        <h1 className="text-4xl font-bold tracking-tight text-center max-w-2xl">
          Debug Non-Deterministic <br />
          <span className="text-blue-600">Algorithmic Pipelines</span>
        </h1>

        <p className="text-center text-gray-500 max-w-md">
          Click the button below to run the "Water Bottle Competitor"
          simulation. The SDK will capture inputs, outputs, and reasoning for
          every step.
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className={`
              group rounded-lg border border-transparent px-5 py-4 transition-colors flex items-center gap-2 text-white font-semibold
              ${
                isRunning
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            `}
          >
            {isRunning ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Running Pipeline...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Run Simulation
              </>
            )}
          </button>

          {status === "success" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
              <p className="text-green-600 font-semibold mb-2">
                Simulation Complete!
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-black underline underline-offset-4"
              >
                View X-Ray Trace <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
