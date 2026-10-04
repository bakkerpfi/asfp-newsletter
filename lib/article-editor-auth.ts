import { requireCompanyAccess } from "@/lib/tenant-auth";

export async function requireArticleEditor(companySlug: string) {
  const tenant = await requireCompanyAccess(companySlug);
  if (
    !tenant.platformAdmin &&
    !["company_admin", "editor"].includes(tenant.role)
  ) {
    throw new Error("Editor access is required.");
  }
  return tenant;
}

export function apiStatus(message: string) {
  if (message === "Authentication required.") return 401;
  if (message.includes("access") || message.includes("Editor")) return 403;
  return 400;
}
