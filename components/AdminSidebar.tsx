import Image from "next/image";
import Link from "next/link";

export default function AdminSidebar() {
  return (
    <aside className="min-h-screen w-72 bg-[#1E2D5A] text-white">

      <div className="border-b border-blue-800 p-6">

        <Image
          src="/AustraliaNewZealand-02.png"
          alt="ASFP"
          width={120}
          height={120}
          className="mx-auto"
        />

        <h2 className="mt-4 text-center text-xl font-bold">
          ASFP Admin
        </h2>

        <p className="mt-1 text-center text-sm text-slate-300">
          Newsletter Portal
        </p>

      </div>

<nav className="p-6 space-y-3">

  <Link
    href="/admin"
    className="block rounded-lg bg-blue-800 px-4 py-3 font-semibold"
  >
    Dashboard
  </Link>

</nav>
    </aside>
  );
}