import { NextResponse } from "next/server";

export async function POST() {
  // Simulated data for recent server status
  const data = {
    lastDowntime: "2023-10-05T14:00:00Z",
  };

  return NextResponse.json(data);
}
