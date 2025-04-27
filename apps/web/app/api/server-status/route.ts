import { NextResponse } from "next/server";

export async function POST() {
  // Simulated data for the last week
  const data = [
    { date: "2023-10-01", status: 1 },
    { date: "2023-10-02", status: 0 },
    { date: "2023-10-03", status: 1 },
    { date: "2023-10-04", status: 1 },
    { date: "2023-10-05", status: 0 },
    { date: "2023-10-06", status: 1 },
    { date: "2023-10-07", status: 1 },
  ];

  return NextResponse.json(data);
}
