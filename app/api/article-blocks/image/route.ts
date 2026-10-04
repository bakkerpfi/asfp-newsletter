import {NextRequest,NextResponse} from "next/server";
import {supabase} from "@/lib/supabase";
import {requireArticleEditor,apiStatus} from "@/lib/article-editor-auth";
const ext:Record<string,string>={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"};
export async function POST(request:NextRequest){
 try{
  const f=await request.formData(),tenant=await requireArticleEditor(String(f.get("companySlug")??"").trim());
  const articleId=Number(f.get("articleId")),file=f.get("image");
  if(!Number.isFinite(articleId))return NextResponse.json({error:"Valid article ID is required."},{status:400});
  const {data:a,error:ae}=await supabase.from("articles").select("id").eq("id",articleId).eq("company_id",tenant.company.id).maybeSingle();if(ae)throw ae;if(!a)return NextResponse.json({error:"Article was not found for this company."},{status:404});
  if(!(file instanceof File))return NextResponse.json({error:"Article image is required."},{status:400});
  if(file.size>5*1024*1024)return NextResponse.json({error:"Article image must be 5 MB or smaller."},{status:400});
  const extension=ext[file.type];if(!extension)return NextResponse.json({error:"Article image must be JPG, PNG or WebP."},{status:400});
  const id=crypto.randomUUID(),path=`${tenant.company.slug}/articles/${articleId}/${id}.${extension}`;
  const {error:up}=await supabase.storage.from("article-images").upload(path,await file.arrayBuffer(),{contentType:file.type});if(up)throw up;
  const {data:pub}=supabase.storage.from("article-images").getPublicUrl(path);
  const {data:last}=await supabase.from("article_blocks").select("sort_order").eq("company_id",tenant.company.id).eq("article_id",articleId).order("sort_order",{ascending:false}).limit(1).maybeSingle();
  const {data,error}=await supabase.from("article_blocks").insert({company_id:tenant.company.id,article_id:articleId,block_type:"image",image_url:pub.publicUrl,caption:String(f.get("caption")??"").trim()||null,image_size:String(f.get("image_size")??"medium"),image_alignment:String(f.get("image_alignment")??"centre"),sort_order:Number(last?.sort_order??-1)+1}).select().single();if(error)throw error;
  return NextResponse.json({success:true,block:data});
 }catch(e){const message=e instanceof Error?e.message:String(e);return NextResponse.json({error:message},{status:apiStatus(message)});}
}

export async function PATCH(request:NextRequest){
 try{
  const f=await request.formData(),tenant=await requireArticleEditor(String(f.get("companySlug")??"").trim());
  const blockId=String(f.get("blockId")??"").trim(),file=f.get("image");
  const {data:block,error:be}=await supabase.from("article_blocks").select("id,article_id,block_type").eq("id",blockId).eq("company_id",tenant.company.id).maybeSingle();
  if(be)throw be;if(!block||block.block_type!=="image")return NextResponse.json({error:"Photo block was not found for this company."},{status:404});
  const {data:a,error:ae}=await supabase.from("articles").select("id").eq("id",block.article_id).eq("company_id",tenant.company.id).maybeSingle();if(ae)throw ae;if(!a)return NextResponse.json({error:"Article was not found for this company."},{status:404});
  if(!(file instanceof File))return NextResponse.json({error:"Replacement photo is required."},{status:400});
  if(file.size>5*1024*1024)return NextResponse.json({error:"Article image must be 5 MB or smaller."},{status:400});
  const extension=ext[file.type];if(!extension)return NextResponse.json({error:"Article image must be JPG, PNG or WebP."},{status:400});
  const path=`${tenant.company.slug}/articles/${block.article_id}/${crypto.randomUUID()}.${extension}`;
  const {error:up}=await supabase.storage.from("article-images").upload(path,await file.arrayBuffer(),{contentType:file.type});if(up)throw up;
  const {data:pub}=supabase.storage.from("article-images").getPublicUrl(path);
  const {data,error}=await supabase.from("article_blocks").update({image_url:pub.publicUrl,caption:String(f.get("caption")??"").trim()||null,image_size:String(f.get("image_size")??"medium"),image_alignment:String(f.get("image_alignment")??"centre"),updated_at:new Date().toISOString()}).eq("id",blockId).eq("company_id",tenant.company.id).eq("article_id",block.article_id).select().single();
  if(error)throw error;return NextResponse.json({success:true,block:data});
 }catch(e){const message=e instanceof Error?e.message:String(e);return NextResponse.json({error:message},{status:apiStatus(message)});}
}

