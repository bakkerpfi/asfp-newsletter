import { buildRecovery } from "@/lib/campaign-recovery";

export async function GET() {

  const recovery = await buildRecovery();

  return Response.json({
    success: true,
    summary: recovery.summary,
  });

}