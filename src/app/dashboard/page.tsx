"use client";
import { useEffect, useState } from "react";
import { XRayTrace, XRayStep } from "@/types/xray";
import {
  CheckCircle2,
  XCircle,
  Activity,
  Box,
  Clock,
  Trash2,
  RefreshCw,
  BarChart3,
  Timer,
} from "lucide-react";

// --- 1. Helper Function for Metrics ---
function getStats(traces: XRayTrace[]) {
  if (traces.length === 0) return { total: 0, successRate: 0, avgLatency: 0 };

  const total = traces.length;
  const passed = traces.filter((t) => t.status === "success").length;
  // Calculate average latency (defaulting to 0 if meta is missing)
  const totalDuration = traces.reduce(
    (acc, t) => acc + (t.meta?.duration || 0),
    0
  );

  return {
    total,
    successRate: Math.round((passed / total) * 100),
    avgLatency: Math.round(totalDuration / total),
  };
}

// --- 2. Stats Bar Component ---
function StatsBar({ traces }: { traces: XRayTrace[] }) {
  const stats = getStats(traces);

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* Total Runs Card */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BarChart3 className="w-12 h-12 text-blue-500" />
        </div>
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Total Executions
        </div>
        <div className="text-3xl font-mono text-white font-bold">
          {stats.total}
        </div>
      </div>

      {/* Success Rate Card */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3" /> Success Rate
        </div>
        <div
          className={`text-3xl font-mono font-bold ${
            stats.successRate >= 80 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {stats.successRate}%
        </div>
      </div>

      {/* Latency Card */}
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Timer className="w-12 h-12 text-blue-500" />
        </div>
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
          <Clock className="w-3 h-3" /> Avg Latency
        </div>
        <div className="text-3xl font-mono text-blue-400 font-bold">
          {stats.avgLatency}ms
        </div>
      </div>
    </div>
  );
}

// --- 3. Main Dashboard ---
export default function Dashboard() {
  const [traces, setTraces] = useState<XRayTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<XRayTrace | null>(null);

  const fetchTraces = async () => {
    const res = await fetch("/api/ingest");
    const data = await res.json();
    setTraces(data);
    // Don't auto-select if we already have one selected, unless list was empty
    if (!selectedTrace && data.length > 0) setSelectedTrace(data[0]);
  };

  useEffect(() => {
    fetchTraces();
  }, []);

  const clearHistory = async () => {
    if (!confirm("Clear all traces?")) return;
    await fetch("/api/ingest", { method: "DELETE" });
    setTraces([]);
    setSelectedTrace(null);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="font-bold text-sm flex items-center gap-2 text-slate-100">
            <Activity className="w-4 h-4 text-blue-500" /> RUN HISTORY
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchTraces}
              className="text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all p-1.5 rounded-md"
              title="Refresh Traces"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={clearHistory}
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all p-1.5 rounded-md"
              title="Clear History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {traces.map((trace) => (
          <div
            key={trace.traceId}
            onClick={() => setSelectedTrace(trace)}
            className={`
                p-4 border-b border-slate-800/50 cursor-pointer transition-all group
                ${
                  selectedTrace?.traceId === trace.traceId
                    ? "bg-blue-900/20 border-l-2 border-l-blue-500"
                    : "hover:bg-slate-800/50 border-l-2 border-l-transparent hover:border-l-slate-600"
                }
            `}
          >
            <div className="flex justify-between items-center mb-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  trace.status === "success"
                    ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/5 text-red-400 border-red-500/20"
                }`}
              >
                {trace.status.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(trace.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div
              className={`font-mono text-xs truncate mt-2 ${
                selectedTrace?.traceId === trace.traceId
                  ? "text-blue-200"
                  : "text-slate-400 group-hover:text-slate-300"
              }`}
            >
              Run: {trace.traceId.slice(0, 8)}...
            </div>
          </div>
        ))}
      </div>

      {/* Main View */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#0B0C10]">
        <div className="max-w-6xl mx-auto">
          {/* Always show Stats Bar if there is data */}
          {traces.length > 0 && <StatsBar traces={traces} />}

          {selectedTrace ? (
            <TraceDetailView trace={selectedTrace} />
          ) : (
            <div className="flex h-[60vh] flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a run from the sidebar to inspect execution details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TraceDetailView({ trace }: { trace: XRayTrace }) {
  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trace Analysis</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-mono">
            <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {trace.traceId}
            </span>
          </div>
        </div>

        {/* Dark Mode Subway Map */}
        <div className="flex gap-2">
          {trace.steps.map((s, i) => (
            <div key={s.id} className="flex items-center text-xs font-semibold">
              <div
                className={`
                        px-3 py-1.5 rounded-full border transition-all
                        ${
                          i === trace.steps.length - 1
                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            : "bg-slate-900 border-slate-700 text-slate-500"
                        }
                    `}
              >
                {s.name.split(".")[1] || s.name}
              </div>
              {i < trace.steps.length - 1 && (
                <div className="w-6 h-[2px] bg-slate-800 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-6 space-y-12">
        {trace.steps.map((step, idx) => (
          <StepCard key={step.id} step={step} index={idx} />
        ))}
      </div>
    </div>
  );
}

function StepCard({ step, index }: { step: XRayStep; index: number }) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="relative pl-10 group">
      {/* Timeline Dot */}
      <div className="absolute -left-[13px] top-0 flex items-center justify-center w-7 h-7 rounded-full bg-slate-950 border-2 border-slate-800 text-slate-500 text-xs font-bold ring-4 ring-slate-950 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors z-10">
        {index + 1}
      </div>

      {/* Main Card Container */}
      <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 overflow-hidden hover:border-slate-600 transition-colors shadow-sm">
        {/* Step Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {step.name}
              </h3>
              <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-blue-500/20">
                  Reasoning
                </span>
                {step.reasoning}
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <Clock className="w-4 h-4 text-slate-600 mb-1" />
              <div className="text-xs font-mono text-slate-500">
                ~{Math.floor(Math.random() * 200) + 50}ms
              </div>
            </div>
          </div>
        </div>

        {/* X-Ray Candidates Grid */}
        {step.candidates && step.candidates.length > 0 && (
          <div className="p-6 bg-slate-950/30">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Box className="w-3 h-3" /> Decision Stream
              </div>
              <div className="text-xs text-slate-600 font-mono">
                {step.candidates.length} CANDIDATES
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {step.candidates.map((c, i) => (
                <div
                  key={i}
                  className={`
                        flex gap-4 p-3 rounded-lg border transition-all
                        ${
                          c.status === "rejected"
                            ? "bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100 hover:border-red-900/50 grayscale-[0.3]"
                            : "bg-gradient-to-br from-slate-900 to-slate-800/50 border-emerald-500/20 shadow-lg shadow-black/20 hover:border-emerald-500/50"
                        }
                    `}
                >
                  {/* Image Thumbnail */}
                  <div className="w-16 h-16 bg-slate-800 rounded-md overflow-hidden flex-shrink-0 border border-slate-700/50">
                    {c.data?.image ? (
                      <img
                        src={c.data.image}
                        alt={c.name}
                        className="w-full h-full object-cover opacity-90"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Box className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex justify-between items-start">
                      <h4
                        className={`font-medium text-sm truncate pr-2 ${
                          c.status === "selected"
                            ? "text-emerald-50 text-base"
                            : "text-slate-500"
                        }`}
                      >
                        {c.name}
                      </h4>
                      {c.status === "selected" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500/70 flex-shrink-0" />
                      )}
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex gap-2 mt-2 text-[10px] font-mono text-slate-500">
                      {c.data?.price && (
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
                          ${c.data.price}
                        </span>
                      )}
                      {c.data?.rating && (
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">
                          ★ {c.data.rating}
                        </span>
                      )}
                    </div>

                    {/* Failure Reason */}
                    {c.reason && (
                      <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {c.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Data Toggle (Merged and Inside Card) */}
        <div className="bg-slate-900 border-t border-slate-800">
          <button
            onClick={() => setShowJson(!showJson)}
            className="w-full p-2 text-[10px] text-slate-600 font-mono text-center hover:bg-slate-800 hover:text-blue-400 transition-colors uppercase tracking-wider"
          >
            {showJson ? "Hide Raw Data" : "View Raw JSON Payload"}
          </button>

          {showJson && (
            <div className="p-4 overflow-x-auto bg-black/50 border-t border-slate-800">
              <pre className="text-[10px] text-emerald-600 font-mono">
                {JSON.stringify(step, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
