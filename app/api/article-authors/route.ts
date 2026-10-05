import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";
import { requireArticleEditor, apiStatus } from "@/lib/article-editor-auth";

export async function GET(request: NextRequest) {
  try {
    const tenant = await requireCompanyAccess(request.nextUrl.searchParams.get("company"));
    const { data, error } = await supabase.from("article_authors")
      .select("*").eq("company_id", tenant.company.id)
      .order("active", { ascending: false }).order("name");
    if (error) throw error;
    return NextResponse.json(data ?? []);
} catch (e) {
  console.error("ARTICLE AUTHORS GET ERROR:", e);

  const message =
    e instanceof Error
      ? e.message
      : String(e);

  return NextResponse.json(
    { error: message },
    { status: apiStatus(message) }
  );
}
}

export async function POST(request: NextRequest) {
  try {
    const body=await request.json();
    const tenant=await requireArticleEditor(String(body.companySlug??"").trim());
    const name=String(body.name??"").trim();
    if(!name) return NextResponse.json({error:"Author name is required."},{status:400});
    const {data,error}=await supabase.from("article_authors").insert({
      company_id:tenant.company.id,name,
      job_title:String(body.job_title??"").trim()||null,
      active:true
    }).select().single();
    if(error)throw error;
    return NextResponse.json({success:true,author:data});
} catch (e) {
  console.error("ARTICLE AUTHORS GET ERROR:", e);

  const message =
    e instanceof Error
      ? e.message
      : String(e);

  return NextResponse.json(
    { error: message },
    { status: apiStatus(message) }
  );
}
}

export async function PATCH(request: NextRequest) {
  try {
    const body=await request.json();
    const tenant=await requireArticleEditor(String(body.companySlug??"").trim());
    const id=String(body.id??"").trim(),name=String(body.name??"").trim();
    if(!id||!name)return NextResponse.json({error:"Author and name are required."},{status:400});
    const {data,error}=await supabase.from("article_authors").update({
      name,job_title:String(body.job_title??"").trim()||null,
      active:body.active!==false,updated_at:new Date().toISOString()
    }).eq("id",id).eq("company_id",tenant.company.id).select().maybeSingle();
    if(error)throw error;
    if(!data)return NextResponse.json({error:"Author was not found for this company."},{status:404});
    return NextResponse.json({success:true,author:data});
} catch (e) {
  console.error("ARTICLE AUTHORS GET ERROR:", e);

  const message =
    e instanceof Error
      ? e.message
      : String(e);

  return NextResponse.json(
    { error: message },
    { status: apiStatus(message) }
  );
}
}
