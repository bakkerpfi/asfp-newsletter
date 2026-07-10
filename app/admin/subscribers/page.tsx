"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

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

            <button
              onClick={saveSubscriber}
              className="rounded bg-red-500 px-6 py-3 text-white"
            >
              Add Subscriber
            </button>

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

<td className="py-3">
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