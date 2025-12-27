// src/app/api/ingest/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { XRayTrace } from "@/types/xray";

const DB_PATH = path.join(process.cwd(), "data", "traces.json");

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "[]");
}

export async function POST(req: Request) {
  try {
    const trace: XRayTrace = await req.json();

    // Read existing
    const fileData = fs.readFileSync(DB_PATH, "utf-8");
    const traces: XRayTrace[] = JSON.parse(fileData);

    // Add new (prepend to keep latest top)
    traces.unshift(trace);

    // Write back
    fs.writeFileSync(DB_PATH, JSON.stringify(traces, null, 2));

    return NextResponse.json({ success: true, id: trace.traceId });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to save trace" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const fileData = fs.readFileSync(DB_PATH, "utf-8");
  return NextResponse.json(JSON.parse(fileData));
}
