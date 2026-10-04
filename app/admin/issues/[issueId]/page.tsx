import AdminSidebar from "@/components/AdminSidebar";
import NewsletterBuilder from "@/components/NewsletterBuilder";
import {createSupabaseServerClient} from "@/lib/supabase-server";
import {notFound,redirect} from "next/navigation";
export default async function Page({params,searchParams}:{params:Promise<{issueId:string}>;searchParams:Promise<{company?:string}>}){
 const {issueId}=await params,q=await searchParams,db=await createSupabaseServerClient();
 const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const {data:p}=await db.from("profiles").select("platform_admin").eq("id",user.id).single();
 const {data:m}=await db.from("company_users").select("company_id").eq("user_id",user.id);let ids=m?.map(x=>x.company_id)??[];
 if(p?.platform_admin){const {data:a}=await db.from("companies").select("id").eq("active",true);ids=a?.map(x=>x.id)??[];}
 const {data:r}=await db.from("companies").select("id,name,slug,logo_url,primary_colour,secondary_colour").in("id",ids).eq("active",true).order("name");
 const companies=r??[];if(!companies.length)redirect("/admin");const c=(q.company?companies.find(x=>x.slug===q.company):null)??companies[0];
 const id=Number(issueId);if(!Number.isFinite(id))notFound();const {data:i}=await db.from("issues").select("*").eq("id",id).eq("company_id",c.id).maybeSingle();if(!i)notFound();
 return <div className="flex"><AdminSidebar companies={companies as any} currentCompany={c as any} platformAdmin={p?.platform_admin??false}/><main className="flex-1 bg-slate-100 p-10"><NewsletterBuilder currentCompany={c} issue={i}/></main></div>;
}