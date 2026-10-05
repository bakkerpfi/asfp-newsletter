import {NextRequest,NextResponse} from "next/server";
import {supabase} from "@/lib/supabase";
import {requireCompanyAccess} from "@/lib/tenant-auth";
import {requireArticleEditor,apiStatus} from "@/lib/article-editor-auth";

async function articleFor(companyId:string,articleId:number){
 const {data,error}=await supabase.from("articles").select("id").eq("id",articleId).eq("company_id",companyId).maybeSingle();
 if(error)throw error;return data;
}
export async function GET(request:NextRequest){
 try{
  const tenant=await requireCompanyAccess(request.nextUrl.searchParams.get("company"));
  const articleId=Number(request.nextUrl.searchParams.get("article"));
  if(!Number.isFinite(articleId))return NextResponse.json({error:"Valid article ID is required."},{status:400});
  if(!await articleFor(tenant.company.id,articleId))return NextResponse.json({error:"Article was not found for this company."},{status:404});
  const {data,error}=await supabase.from("article_blocks").select("*").eq("company_id",tenant.company.id).eq("article_id",articleId).order("sort_order").order("created_at");
  if(error)throw error;return NextResponse.json(data??[]);
 }catch(e){const message=e instanceof Error?e.message:String(e);return NextResponse.json({error:message},{status:apiStatus(message)});}
}
export async function POST(request:NextRequest){
 try{
  const b=await request.json(),tenant=await requireArticleEditor(String(b.companySlug??"").trim()),articleId=Number(b.article_id);
  if(!Number.isFinite(articleId)||!await articleFor(tenant.company.id,articleId))return NextResponse.json({error:"Article was not found for this company."},{status:404});
  const type=String(b.block_type??"");if(!["text","image","quote","button"].includes(type))return NextResponse.json({error:"Invalid block type."},{status:400});
  const {data:last}=await supabase.from("article_blocks").select("sort_order").eq("company_id",tenant.company.id).eq("article_id",articleId).order("sort_order",{ascending:false}).limit(1).maybeSingle();
  const {data,error}=await supabase.from("article_blocks").insert({
   company_id:tenant.company.id,article_id:articleId,block_type:type,
   content:String(b.content??"").trim()||null,caption:String(b.caption??"").trim()||null,
   image_size:b.image_size||null,image_alignment:b.image_alignment||null,
   sort_order:Number(last?.sort_order??-1)+1
  }).select().single();if(error)throw error;return NextResponse.json({success:true,block:data});
 }catch(e){const message=e instanceof Error?e.message:String(e);return NextResponse.json({error:message},{status:apiStatus(message)});}
}
export async function PATCH(request:NextRequest){
 try{
  const b=await request.json(),tenant=await requireArticleEditor(String(b.companySlug??"").trim());
  const blockId=String(b.id??"").trim();
  const {data:existing,error:existingError}=await supabase.from("article_blocks").select("id,article_id,block_type").eq("id",blockId).eq("company_id",tenant.company.id).maybeSingle();
  if(existingError)throw existingError;
  if(!existing)return NextResponse.json({error:"Block was not found for this company."},{status:404});
  if(!await articleFor(tenant.company.id,Number(existing.article_id)))return NextResponse.json({error:"Article was not found for this company."},{status:404});
  const update:any={updated_at:new Date().toISOString()};
  if(existing.block_type==="text"||existing.block_type==="quote")update.content=String(b.content??"").trim()||null;
  if(existing.block_type==="image"){
   update.caption=String(b.caption??"").trim()||null;
   update.image_size=b.image_size||"medium";
   update.image_alignment=b.image_alignment||"centre";
  }
  const {data,error}=await supabase.from("article_blocks").update(update).eq("id",blockId).eq("company_id",tenant.company.id).eq("article_id",existing.article_id).select().maybeSingle();
  if(error)throw error;if(!data)return NextResponse.json({error:"Block was not found for this company."},{status:404});
  return NextResponse.json({success:true,block:data});
 }catch(e){const message=e instanceof Error?e.message:String(e);return NextResponse.json({error:message},{status:apiStatus(message)});}
}
export async function DELETE(request:NextRequest){
 try{
  const b=await request.json(),tenant=await requireArticleEditor(String(b.companySlug??"").trim());
  const {data,error}=await supabase.from("article_blocks").delete().eq("id",String(b.id??"")).eq("company_id",tenant.company.id).select("id").maybeSingle();
  if(error)throw error;if(!data)return NextResponse.json({error:"Block was not found for this company."},{status:404});
  return NextResponse.json({success:true});
 }catch(e){const message=e instanceof Error?e.message:String(e);return NextResponse.json({error:message},{status:apiStatus(message)});}
}
