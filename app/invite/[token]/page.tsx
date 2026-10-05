import InviteAcceptance from "@/components/InviteAcceptance";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
type Props={params:Promise<{token:string}>};
export default async function InvitePage({params}:Props){
 const {token}=await params;
 const {data:i}=await supabase.from("company_invitations").select("id,contact_name,contact_email,role,status,expires_at,token,companies(id,name,slug)").eq("token",token).maybeSingle();
 if(!i)return <main className="p-10">Invitation not found.</main>;
 const expired=new Date(i.expires_at).getTime()<Date.now();
 const auth=await createSupabaseServerClient();const {data:{user}}=await auth.auth.getUser();
 return <InviteAcceptance invitation={i as any} expired={expired} signedInEmail={user?.email??null}/>;
}