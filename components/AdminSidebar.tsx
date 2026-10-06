import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
};

type AdminSidebarProps = {
  companies?: Company[];
  currentCompany?: Company | null;
  platformAdmin?: boolean;
};

export default function AdminSidebar({
  companies = [],
  currentCompany = null,
  platformAdmin = false,
}: AdminSidebarProps) {
  const companySlug =
    currentCompany?.slug ?? "";

  function companyHref(path: string) {
    if (!companySlug) {
      return path;
    }

    return `${path}?company=${encodeURIComponent(
      companySlug
    )}`;
  }

const sidebarColour = "#111318";

  const secondaryColour =
    currentCompany?.secondary_colour ||
    "#DC2626";

  return (
<aside
  className="min-h-screen w-72 text-white"
  style={{
    backgroundColor: sidebarColour,
  }}
>
      {/* PLATFORM HEADER */}

      <div className="border-b border-white/10 p-6">
<img
  src="/Codexus-logo.png"
  alt="Codexus"
  className="mx-auto h-20 w-20 object-contain"
/>

        <h2 className="mt-4 text-center text-xl font-bold">
          CODEXUS
        </h2>

        <p className="mt-1 text-center text-sm text-white/70">
          Newsletter Platform
        </p>
      </div>

      {/* CURRENT COMPANY */}

      {currentCompany && (
        <div className="border-b border-white/10 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Current Company
          </p>

          <div className="rounded-lg bg-white/10 p-3">
            <p className="font-semibold">
              {currentCompany.name}
            </p>
          </div>

          {companies.length > 1 && (
            <div className="mt-3 space-y-1">
              {companies.map((company) => {
                const selected =
                  company.id ===
                  currentCompany.id;

                return (
                  <Link
                    key={company.id}
                    href={`/admin?company=${encodeURIComponent(
                      company.slug
                    )}`}
                    className={`block rounded-md px-3 py-2 text-sm transition ${
                      selected
                        ? "bg-white text-slate-900"
                        : "bg-white/5 text-white hover:bg-white/15"
                    }`}
                  >
                    {company.name}
                  </Link>
                );
              })}
            </div>
          )}

          {platformAdmin && (
            <p className="mt-3 text-xs text-white/60">
              Platform Administrator
            </p>
          )}
        </div>
      )}

      {/* NAVIGATION */}

      <nav className="space-y-2 p-6">
        {platformAdmin && (
          <>
            <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
              Platform
            </p>
            <Link
              href="/admin/companies"
              className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-white/10"
            >
              Companies
            </Link>
            <div className="my-4 border-t border-white/10" />
          </>
        )}
        <Link
          href={companyHref("/admin")}
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-white/10"
        >
          Dashboard
        </Link>

        <Link
          href={companyHref("/admin/issues")}
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-white/10"
        >
          Newsletter Issues
        </Link>

        <Link
          href={companyHref("/admin/articles")}
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-white/10"
        >
          Newsletter Builder
        </Link>

        <Link
          href={companyHref("/admin/settings")}
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-white/10"
        >
          Company Settings
        </Link>

        <div className="my-4 border-t border-white/10" />

        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
          Email
        </p>

        <Link
          href={companyHref("/admin/email")}
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-white/10"
        >
          Newsletter Campaign
        </Link>

        <Link
          href={companyHref(
            "/admin/email/create"
          )}
          className="block rounded-lg px-4 py-3 font-semibold transition"
          style={{
            backgroundColor:
              secondaryColour,
          }}
        >
          Create Email
        </Link>
      </nav>
            {/* ACCOUNT */}

      <div className="border-t border-white/10 p-6">
        <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">
          Account
        </p>

        <SignOutButton />
      </div>
    </aside>
  );
}
