import {NextRequest,NextResponse} from "next/server";
import {createSupabaseServerClient} from "@/lib/supabase-server";
import {supabase} from "@/lib/supabase";

async function requirePlatformAdmin(){
  const auth=await createSupabaseServerClient();
  const {data:{user}}=await auth.auth.getUser();
  if(!user)throw new Error("Authentication required.");
  const {data:profile}=await auth.from("profiles").select("platform_admin").eq("id",user.id).single();
  if(!profile?.platform_admin)throw new Error("Platform administrator access is required.");
}

export async function POST(request:NextRequest){
  try{
    await requirePlatformAdmin();
    const body=await request.json();
    const companyId=String(body.companyId??"").trim();
    const action=String(body.action??"").trim();

    const {data:company,error}=await supabase.from("companies")
      .select("id,name,slug,active").eq("id",companyId).maybeSingle();
    if(error)throw error;
    if(!company)return NextResponse.json({error:"Company not found."},{status:404});

    if(action==="delete"){
      const required=`DELETE ${company.name.toUpperCase()}`;
      if(String(body.confirmation??"")!==required)
        return NextResponse.json({error:`Type ${required} exactly to permanently delete this company.`},{status:400});
      const {error:deleteError}=await supabase.from("companies").delete().eq("id",company.id);
      if(deleteError)throw deleteError;
      return NextResponse.json({success:true,message:`${company.name} was permanently deleted.`});
    }

    if(!["deactivate","reactivate"].includes(action))
      return NextResponse.json({error:"Invalid company action."},{status:400});

    const active=action==="reactivate";
    const {error:updateError}=await supabase.from("companies")
      .update({active,updated_at:new Date().toISOString()}).eq("id",company.id);
    if(updateError)throw updateError;

    return NextResponse.json({success:true,message:`${company.name} was ${active?"reactivated":"deactivated"}.`});
  }catch(error){
    const message=error instanceof Error?error.message:typeof error==="object"&&error!==null&&"message" in error?String((error as {message?:unknown}).message):String(error);
    const status=message==="Authentication required."?401:message.includes("Platform administrator")?403:500;
    return NextResponse.json({error:message},{status});
  }
}
