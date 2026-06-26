"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function SponsorsPage() {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");

  const [sponsors, setSponsors] = useState<any[]>([]);

  async function loadSponsors() {
    const response = await fetch("/api/sponsors");
    const data = await response.json();
    setSponsors(data);
  }

  async function saveSponsor() {
    await fetch("/api/sponsors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        website,
        logo,
      }),
    });

    setName("");
    setWebsite("");
    setLogo("");

    loadSponsors();
  }

  useEffect(() => {
    loadSponsors();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 p-10 bg-slate-100">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Sponsors
        </h1>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <div className="grid gap-4">

            <input
              className="border rounded p-3"
              placeholder="Company Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <input
              className="border rounded p-3"
              placeholder="Logo filename"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
            />

            <button
              onClick={saveSponsor}
              className="rounded bg-red-500 py-3 text-white"
            >
              Save Sponsor
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}