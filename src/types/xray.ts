// src/types/xray.ts

export type StepStatus = "success" | "failure";
export type CandidateStatus = "selected" | "rejected" | "pending";

// Represents a single item being evaluated (e.g., a specific product)
export interface XRayCandidate {
  id: string;
  name: string;
  data: Record<string, any>; // Snapshot of item data at this stage
  status: CandidateStatus;
  reason?: string; // Why was it rejected? (e.g., "Price > $50")
}

// Represents one logical step in the pipeline
export interface XRayStep {
  id: string;
  name: string; // e.g., "Filter Candidates"
  timestamp: number;
  input: any;
  output: any;
  reasoning: string; // Human readable summary
  candidates?: XRayCandidate[]; // The X-Ray visibility part
  metadata?: Record<string, any>;
}

// Represents the full execution run
export interface XRayTrace {
  traceId: string;
  timestamp: number;
  status: StepStatus;
  steps: XRayStep[];
  meta: {
    duration: number;
    environment: string;
  };
}
