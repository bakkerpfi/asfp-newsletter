import AdminSidebar from "@/components/AdminSidebar";
import CompanySettingsManager from "@/components/CompanySettingsManager";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ company?: string }> };
type Company = {
  id:string; name:string; slug:string; logo_url:string|null;
  primary_colour:string; secondary_colour:string; accent_colour:string|null;
  website_url:string|null; company_address:string|null;
  sender_name:string|null; sender_email:string|null; reply_to_email:string|null;
  footer_phone:string|null; footer_tagline:string|null;
  footer_show_address:boolean; footer_show_phone:boolean; footer_show_website:boolean;
};

export default async function CompanySettingsPage({searchParams}:Props) {
  const params=await searchParams;
  const supabase=await createSupabaseServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");

  const {data:profile}=await supabase.from("profiles")
    .select("id,platform_admin").eq("id",user.id).single();
  const {data:memberships}=await supabase.from("company_users")
    .select("company_id,role").eq("user_id",user.id);

  let companyIds=memberships?.map(m=>m.company_id)??[];
  if(profile?.platform_admin){
    const {data:all}=await supabase.from("companies").select("id").eq("active",true);
    companyIds=all?.map(c=>c.id)??[];
  }

  const {data:rows}=await supabase.from("companies")
    .select("id,name,slug,logo_url,primary_colour,secondary_colour,accent_colour,website_url,company_address,sender_name,sender_email,reply_to_email,footer_phone,footer_tagline,footer_show_address,footer_show_phone,footer_show_website")
    .in("id",companyIds).eq("active",true).order("name",{ascending:true});
  const companies=(rows??[]) as Company[];
  if(!companies.length) return <main className="p-10">No Company Access</main>;

  const currentCompany=(params.company?companies.find(c=>c.slug===params.company):null)??companies[0];

  return <div className="flex">
    <AdminSidebar companies={companies} currentCompany={currentCompany} platformAdmin={profile?.platform_admin??false}/>
    <main className="flex-1 bg-slate-100 p-10">
      <h1 className="text-4xl font-bold" style={{color:currentCompany.primary_colour}}>Company Settings</h1>
      <p className="mt-2 text-slate-600">Manage branding and email identity for <strong>{currentCompany.name}</strong>.</p>
      <CompanySettingsManager initialCompany={currentCompany}/>
    </main>
  </div>;
}
