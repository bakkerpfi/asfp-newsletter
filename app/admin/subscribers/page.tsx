"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import * as XLSX from "xlsx";

export default function SubscribersPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  const [subscribers, setSubscribers] = useState<any[]>([]);

  async function loadSubscribers() {
    const response = await fetch("/api/subscribers");
    const data = await response.json();
    setSubscribers(data);
  }

async function saveSubscriber() {
  const response = await fetch("/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      company,
      email,
      member_type: "Member",
    }),
  });

  const result = await response.json();

  if (!result.success) {
    alert(result.error);
    return;
  }

  alert("Subscriber added successfully.");

  setName("");
  setCompany("");
  setEmail("");

  loadSubscribers();
}

async function importExcel(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file) return;

  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer);

  const worksheet =
    workbook.Sheets[workbook.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json<any>(worksheet, {
  header: 1,
});

console.log("FIRST ROW:", rows[0]);

const subscribers = rows
  .slice(4)
  .map((row: any[]) => {
    const email = String(row[0] ?? "").trim();
    const company = String(row[1] ?? "").trim();

    // Generate a friendly name from the email address
    const localPart = email.split("@")[0];

    const generatedName = localPart
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      name: generatedName,
      company,
      email,
      member_type: "Industry",
    };
  })
  .filter((s) => s.email);

  console.log(subscribers.slice(0,5));

console.log("FIRST SUBSCRIBER:", subscribers[0]);

  const response = await fetch(
    "/api/subscribers/import",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscribers,
      }),
    }
  );

  const result = await response.json();

  alert(
    `Imported ${result.imported} subscribers.\nSkipped ${result.skipped} duplicates.`
  );

  loadSubscribers();

  // Reset file picker
  event.target.value = "";
}

  useEffect(() => {
    loadSubscribers();
  }, []);

  return (
    <div className="flex">
      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Subscribers
        </h1>

        <input
  id="excelImport"
  type="file"
  accept=".xlsx"
  className="hidden"
  onChange={importExcel}
/>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <div className="grid gap-4">

            <input
              className="rounded border p-3"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="rounded border p-3"
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />

            <input
              className="rounded border p-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

<div className="flex gap-4">

  <button
    onClick={saveSubscriber}
    className="rounded bg-red-500 px-6 py-3 text-white hover:bg-red-600"
  >
    Add Subscriber
  </button>

  <label
    htmlFor="excelImport"
    className="cursor-pointer rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
  >
    Import Excel
  </label>

</div>

          </div>

        </div>

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <h2 className="mb-4 text-2xl font-bold">
            Current Subscribers
          </h2>

          <table className="w-full">

            <thead>
<tr className="border-b">
  <th className="py-2 text-left">Name</th>
  <th className="py-2 text-left">Company</th>
  <th className="py-2 text-left">Email</th>
  <th className="py-2 text-left">Status</th>
  <th className="py-2 text-left">Actions</th>
</tr>
            </thead>

            <tbody>
              {subscribers.map((subscriber) => (
                <tr
                  key={subscriber.id}
                  className="border-b"
                >
                  <td className="py-3">
                    {subscriber.name}
                  </td>

                  <td>
                    {subscriber.company}
                  </td>

<td>
  {subscriber.email}
</td>

<td>
  {subscriber.active ? (
    <span className="rounded bg-green-100 px-2 py-1 text-green-700">
      Active
    </span>
  ) : (
    <span className="rounded bg-red-100 px-2 py-1 text-red-700">
      Unsubscribed
    </span>
  )}
</td>

<td className="py-3">

  {subscriber.active ? (

    <button
      onClick={async () => {
        if (!confirm("Delete this subscriber?")) {
          return;
        }

        await fetch("/api/subscribers/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: subscriber.id,
          }),
        });

        loadSubscribers();
      }}
      className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
    >
      Delete
    </button>

  ) : (

    <button
      onClick={async () => {

        await fetch("/api/subscribers/reactivate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: subscriber.id,
          }),
        });

        loadSubscribers();

      }}
      className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
    >
      Reactivate
    </button>

  )}

</td>

                </tr>
                
              ))}
            </tbody>

          </table>

        </div>

      </main>
    </div>
  );
}