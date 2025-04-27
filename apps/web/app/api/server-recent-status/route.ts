import { NextResponse } from "next/server";

export async function POST() {
  let status = "Offline";
  try {
    const res = await fetch("https://api-rest.elice.io/global/account/get/", {
      method: "GET",
    });
    if (res.ok) {
      status = "Online";
    }
  } catch {
    /* empty */
  }
  return NextResponse.json({
    currentStatus: status,
  });
}
