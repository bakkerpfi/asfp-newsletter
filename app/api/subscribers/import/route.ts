import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {

  const body = await request.json();

  const subscribers = body.subscribers;

  let imported = 0;
  let skipped = 0;

  for (const s of subscribers) {

    if (!s.email) continue;

const { data, error } = await supabase
  .from("subscribers")
  .insert({
    name: s.name,
    company: s.company,
    email: s.email,
    member_type: s.member_type ?? "Industry",
  })
  .select();

console.log("INSERTING:", s);

if (error) {
  console.error("SUPABASE ERROR:", error);
} else {
  console.log("SUCCESS:", data);
  imported++;
}
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
  });

}