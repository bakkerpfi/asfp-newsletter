import Image from "next/image";
import Link from "next/link";

export default function AdminSidebar() {
  return (
    <aside className="min-h-screen w-72 bg-[#1E2D5A] text-white">

      {/* LOGO / HEADER */}

      <div className="border-b border-blue-800 p-6">

        <Image
          src="/AustraliaNewZealand-02.png"
          alt="ASFP Australia & New Zealand"
          width={120}
          height={120}
          className="mx-auto h-auto"
        />

        <h2 className="mt-4 text-center text-xl font-bold">
          ASFP Admin
        </h2>

        <p className="mt-1 text-center text-sm text-slate-300">
          Newsletter Portal
        </p>

      </div>

      {/* NAVIGATION */}

      <nav className="space-y-2 p-6">

        <Link
          href="/admin"
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-blue-800"
        >
          Dashboard
        </Link>

        <Link
          href="/admin/issues"
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-blue-800"
        >
          Newsletter Issues
        </Link>

        <Link
          href="/admin/articles"
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-blue-800"
        >
          Articles
        </Link>

        <Link
          href="/admin/polls"
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-blue-800"
        >
          Polls
        </Link>

        <Link
          href="/admin/subscribers"
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-blue-800"
        >
          Subscribers
        </Link>

        {/* EMAIL SECTION */}

        <div className="my-4 border-t border-blue-800" />

        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Email
        </p>

        <Link
          href="/admin/email"
          className="block rounded-lg px-4 py-3 font-semibold transition hover:bg-blue-800"
        >
          Newsletter Campaign
        </Link>

        <Link
          href="/admin/email/create"
          className="block rounded-lg bg-[#F52B3A] px-4 py-3 font-semibold transition hover:bg-red-600"
        >
          Create Email
        </Link>

      </nav>

    </aside>
  );
}