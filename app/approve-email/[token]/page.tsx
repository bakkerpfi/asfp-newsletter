import { supabase } from "@/lib/supabase";
import ApprovalForm from "@/components/ApprovalForm";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ApproveEmailPage({
  params,
}: Props) {
  const { token } = await params;

  const {
    data: campaign,
  } = await supabase
    .from("announcement_campaigns")
    .select(
      `
      id,
      subject,
      status,
      proof_email,
      proof_sent_at,
      approved_at,
      approved_by_name,
      companies(name,logo_url)
      `
    )
    .eq("approval_token", token)
    .maybeSingle();

  if (!campaign) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-xl rounded-2xl bg-white p-10 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">
            Approval Request Not Found
          </h1>

          <p className="mt-3 text-slate-600">
            This approval link is not valid.
          </p>
        </div>
      </main>
    );
  }

  return (
    <ApprovalForm
      token={token}
      campaign={campaign as any}
    />
  );
}