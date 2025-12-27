import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { XRayTrace } from "@/types/xray";

// We use .jsonl (JSON Lines) - industry standard for log streaming
const DB_PATH = path.join(process.cwd(), "data", "traces.jsonl");

// Ensure directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

export async function POST(req: Request) {
  try {
    const trace: XRayTrace = await req.json();

    // SYSTEM DESIGN FLEX: O(1) Append-Only Write
    // Instead of reading/parsing the whole file, we just append a new line.
    // This mimics how Kafka or DB Write-Ahead-Logs work.
    const logEntry = JSON.stringify(trace) + "\n";
    fs.appendFileSync(DB_PATH, logEntry);

    return NextResponse.json({ success: true, id: trace.traceId });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json([]);
  }

  try {
    // Read the raw log file
    const fileData = fs.readFileSync(DB_PATH, "utf-8");

    // Parse line-by-line
    const traces = fileData
      .trim()
      .split("\n")
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean) // Remove any parse errors
      .reverse(); // Show newest first

    // Optional: Keep GET fast by only returning last 50 items
    const recentTraces = traces.slice(0, 50);

    return NextResponse.json(recentTraces);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function DELETE() {
  try {
    // Truncate file (0 bytes) - Atomic and fast
    fs.writeFileSync(DB_PATH, "");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
