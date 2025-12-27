"use client";
import { useEffect, useState } from "react";
import { XRayTrace, XRayStep } from "@/types/xray";
import { CheckCircle, XCircle, ChevronRight, Activity } from "lucide-react";

export default function Dashboard() {
  const [traces, setTraces] = useState<XRayTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<XRayTrace | null>(null);

  useEffect(() => {
    fetch("/api/ingest")
      .then((res) => res.json())
      .then(setTraces);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar: Trace List */}
      <div className="w-80 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b font-bold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" /> X-Ray Monitor
        </div>
        {traces.map((trace) => (
          <div
            key={trace.traceId}
            onClick={() => setSelectedTrace(trace)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
              selectedTrace?.traceId === trace.traceId
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : ""
            }`}
          >
            <div className="font-mono text-xs text-gray-500">
              {trace.traceId.slice(0, 8)}...
            </div>
            <div className="text-sm font-medium mt-1">
              Run {new Date(trace.timestamp).toLocaleTimeString()}
            </div>
            <div
              className={`text-xs mt-2 inline-block px-2 py-1 rounded-full ${
                trace.status === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {trace.status.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Trace Details */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedTrace ? (
          <TraceDetailView trace={selectedTrace} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a trace to view X-Ray details
          </div>
        )}
      </div>
    </div>
  );
}

function TraceDetailView({ trace }: { trace: XRayTrace }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Execution Analysis</h1>
        <p className="text-gray-600 font-mono text-sm">{trace.traceId}</p>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-4 space-y-12">
        {trace.steps.map((step, idx) => (
          <StepCard key={step.id} step={step} index={idx} />
        ))}
      </div>
    </div>
  );
}

function StepCard({ step, index }: { step: XRayStep; index: number }) {
  return (
    <div className="relative pl-8">
      {/* Timeline Dot */}
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white" />

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{step.name}</h3>
            <p className="text-sm text-blue-600 mt-1">{step.reasoning}</p>
          </div>
          <span className="text-xs font-mono text-gray-400">
            Step {index + 1}
          </span>
        </div>

        {/* The X-Ray "Candidates" View */}
        {step.candidates && step.candidates.length > 0 && (
          <div className="mt-6 border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold uppercase text-gray-500">
              Candidate Evaluation
            </div>
            <div className="divide-y">
              {step.candidates.map((c, i) => (
                <div
                  key={i}
                  className="px-4 py-3 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    {c.status === "selected" ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">{c.name}</span>
                    <span className="text-gray-400 text-xs font-mono">
                      {JSON.stringify(c.data)}
                    </span>
                  </div>
                  {c.reason && (
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs">
                      {c.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input/Output Data */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
            <div className="text-gray-400 mb-1">Input</div>
            <pre>{JSON.stringify(step.input, null, 2)}</pre>
          </div>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
            <div className="text-gray-400 mb-1">Output</div>
            <pre>{JSON.stringify(step.output, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
