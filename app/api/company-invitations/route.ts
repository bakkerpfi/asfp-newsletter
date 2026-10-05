import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

function slugify(value:string){
  return value.normalize("NFKD").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60);
}
function cleanEmail(value:unknown){
  return String(value??"").normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200D\u2060\uFEFF]/g,"")
    .replace(/\s+/g,"").trim().toLowerCase();
}
async function requirePlatformAdmin(){
  const auth=await createSupabaseServerClient();
  const {data:{user}}=await auth.auth.getUser();
  if(!user) throw new Error("Authentication required.");
  const {data:profile}=await auth.from("profiles").select("platform_admin").eq("id",user.id).single();
  if(!profile?.platform_admin) throw new Error("Platform administrator access is required.");
  return user;
}
export async function POST(request:NextRequest){
  let createdCompanyId:string|null=null;
  try{
    const user=await requirePlatformAdmin();
    const body=await request.json();
    const companyName=String(body.companyName??"").trim();
    const contactName=String(body.contactName??"").trim();
    const contactEmail=cleanEmail(body.contactEmail);
    if(!companyName||!contactName||!contactEmail)
      return NextResponse.json({success:false,error:"Company name, contact name and contact email are required."},{status:400});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      return NextResponse.json({success:false,error:"Please enter a valid contact email address."},{status:400});

    const base=slugify(companyName);
    if(!base) return NextResponse.json({success:false,error:"Unable to create a company slug from this name."},{status:400});
    let slug=base, suffix=2;
    while(true){
      const {data,error}=await supabase.from("companies").select("id").eq("slug",slug).maybeSingle();
      if(error) throw error;
      if(!data) break;
      slug=`${base}-${suffix++}`;
    }

    const {data:company,error:companyError}=await supabase.from("companies").insert({
      name:companyName,slug,sender_name:companyName,active:true
    }).select("id,name,slug,logo_url,primary_colour,secondary_colour,active,created_at").single();
    if(companyError||!company) throw companyError||new Error("Company could not be created.");
    createdCompanyId=company.id;

    const {data:invitation,error:inviteError}=await supabase.from("company_invitations").insert({
      company_id:company.id,contact_name:contactName,contact_email:contactEmail,
      role:"company_admin",status:"pending",invited_by:user.id
    }).select("id,company_id,contact_name,contact_email,token,role,status,expires_at,created_at").single();
    if(inviteError||!invitation) throw inviteError||new Error("Invitation could not be created.");

    return NextResponse.json({success:true,company,invitation:{
      ...invitation,companies:{name:company.name,slug:company.slug}
    }});
  }catch(error){
    if(createdCompanyId) await supabase.from("companies").delete().eq("id",createdCompanyId);
    const message =
  error instanceof Error
    ? error.message
    : typeof error === "object" &&
      error !== null &&
      "message" in error
    ? String(
        (error as { message?: unknown })
          .message ?? "Unknown database error."
      )
    : String(error);
    const status=message==="Authentication required."?401:message.includes("Platform administrator")?403:400;
    return NextResponse.json({success:false,error:message},{status});
  }
}
