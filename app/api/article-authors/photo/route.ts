import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireArticleEditor, apiStatus } from "@/lib/article-editor-auth";

const extensions:Record<string,string>={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};

export async function POST(request:NextRequest){
 try{
  const form=await request.formData();
  const tenant=await requireArticleEditor(String(form.get("companySlug")??"").trim());
  const authorId=String(form.get("authorId")??"").trim(),file=form.get("photo");
  if(!(file instanceof File))return NextResponse.json({error:"Profile photo is required."},{status:400});
  if(file.size>5*1024*1024)return NextResponse.json({error:"Profile photo must be 5 MB or smaller."},{status:400});
  const ext=extensions[file.type];if(!ext)return NextResponse.json({error:"Profile photo must be JPG, PNG or WebP."},{status:400});
  const {data:author,error:aerr}=await supabase.from("article_authors").select("id").eq("id",authorId).eq("company_id",tenant.company.id).maybeSingle();
  if(aerr)throw aerr;if(!author)return NextResponse.json({error:"Author was not found for this company."},{status:404});
  const path=`${tenant.company.slug}/authors/${authorId}.${ext}`;
  const {error:up}=await supabase.storage.from("article-author-photos").upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:true});if(up)throw up;
  const {data:pub}=supabase.storage.from("article-author-photos").getPublicUrl(path);
  const photo_url=`${pub.publicUrl}?v=${Date.now()}`;
  const {error:u}=await supabase.from("article_authors").update({photo_url,updated_at:new Date().toISOString()}).eq("id",authorId).eq("company_id",tenant.company.id);if(u)throw u;
  return NextResponse.json({success:true,photo_url});
 }catch(e){const message=e instanceof Error?e.message:String(e);return NextResponse.json({error:message},{status:apiStatus(message)});}
}
