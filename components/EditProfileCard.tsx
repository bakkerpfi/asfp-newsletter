"use client";

import { useState } from "react";

export default function EditProfileCard({
  subscriber,
}: {
  subscriber: any;
}) {

  const [name, setName] = useState(subscriber.name);
  const [company, setCompany] = useState(subscriber.company);
  const [email, setEmail] = useState(subscriber.email);

  async function save() {

    const response = await fetch(
      "/api/subscribers/update",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: subscriber.unsubscribe_token,
          name,
          company,
          email,
        }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      alert(result.error);
      return;
    }

    alert("Profile updated successfully.");
  }

  return (

    <div className="rounded-xl bg-white p-8 shadow">

      <h2 className="text-2xl font-bold text-[#1E2D5A]">
        Member Details
      </h2>

      <div className="mt-6 space-y-5">

        <div>

          <label className="mb-1 block text-sm font-medium">
            Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border p-3"
          />

        </div>

        <div>

          <label className="mb-1 block text-sm font-medium">
            Company
          </label>

          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded border p-3"
          />

        </div>

        <div>

          <label className="mb-1 block text-sm font-medium">
            Email
          </label>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-3"
          />

        </div>

        <button
          onClick={save}
          className="rounded bg-[#1E2D5A] px-6 py-3 text-white hover:bg-blue-900"
        >
          Save Changes
        </button>

      </div>

    </div>

  );

}