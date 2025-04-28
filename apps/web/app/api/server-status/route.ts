import { AllServerStatus } from "@/page";

export async function GET(): Promise<Response> {
  try {
    const res = await fetch("http://localhost:9999/api/server-status");
    const data = await res.json();
    return Response.json(data satisfies AllServerStatus);
  } catch (error) {
    return Response.json({} satisfies AllServerStatus);
  }
}
