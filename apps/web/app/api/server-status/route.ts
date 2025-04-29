import { AllServerStatus } from "@/page";

export async function GET(): Promise<Response> {
  const defaultURL: string = process.env.API_SERVER_URI || "";
  try {
    const res = await fetch(defaultURL + "/api/server-status");
    const data = await res.json();
    return Response.json(data satisfies AllServerStatus);
  } catch (error) {
    return Response.json({} satisfies AllServerStatus);
  }
}
