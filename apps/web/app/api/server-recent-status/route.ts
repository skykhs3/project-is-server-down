import { NextResponse } from "next/server";

export async function GET() {
  // Simulated data for recent server status
  const data = {
    lastDowntime: "2023-10-05T14:00:00Z",
    currentStatus: "Online",
  };

  return NextResponse.json(data);
}
