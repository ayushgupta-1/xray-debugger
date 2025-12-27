// src/lib/xray-sdk.ts
import { v4 as uuidv4 } from "uuid";
import { XRayTrace, XRayStep, XRayCandidate } from "@/types/xray";

export class XRaySDK {
  private traceId: string;
  private steps: XRayStep[] = [];
  private startTime: number;
  private apiEndpoint: string;

  constructor(options: { endpoint?: string } = {}) {
    this.traceId = uuidv4();
    this.startTime = Date.now();
    // In a real app, this points to your separate backend.
    // Here, it points to our own Next.js API route.
    this.apiEndpoint = options.endpoint || "http://localhost:3000/api/ingest";
  }

  // Captures a discrete step in the process
  addStep(step: Omit<XRayStep, "id" | "timestamp">) {
    this.steps.push({
      ...step,
      id: uuidv4(),
      timestamp: Date.now(),
    });
  }

  // Helper to wrap a function execution automatically
  async trace<T>(
    name: string,
    fn: () => Promise<T>,
    context: {
      input: any;
      // User provides a function to extract reasoning/candidates from the result
      explain: (result: T) => {
        reasoning: string;
        candidates?: XRayCandidate[];
        output?: any;
      };
    }
  ): Promise<T> {
    const result = await fn();
    const explanation = context.explain(result);

    this.addStep({
      name,
      input: context.input,
      output: explanation.output || result,
      reasoning: explanation.reasoning,
      candidates: explanation.candidates,
    });

    return result;
  }

  // Finalize and send data to the dashboard
  async submit(status: "success" | "failure" = "success") {
    const payload: XRayTrace = {
      traceId: this.traceId,
      timestamp: this.startTime,
      status,
      steps: this.steps,
      meta: {
        duration: Date.now() - this.startTime,
        environment: process.env.NODE_ENV || "development",
      },
    };

    try {
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(`[X-Ray] Trace submitted: ${this.traceId}`);
    } catch (e) {
      console.error("[X-Ray] Failed to submit trace", e);
    }
  }
}
