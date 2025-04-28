import { AllServerStatus } from "@/page";

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(process.env.API_SERVER_URI || "");
    const data = await res.json();
    return Response.json(data satisfies AllServerStatus);
  } catch (error) {
    return Response.json({} satisfies AllServerStatus);
  }
}
