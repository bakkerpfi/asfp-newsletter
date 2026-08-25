"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import * as XLSX from "xlsx";

export default function SubscribersPage() {
  const searchParams = useSearchParams();

  const initialStatus =
    searchParams.get("status") ?? "all";

  const [statusFilter, setStatusFilter] =
    useState(initialStatus);

  const [search, setSearch] = useState("");

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

    const rows = XLSX.utils.sheet_to_json<any>(
      worksheet,
      {
        header: 1,
      }
    );

    console.log("FIRST ROW:", rows[0]);

    const subscribers = rows
      .slice(4)
      .map((row: any[]) => {
        const email = String(
          row[0] ?? ""
        ).trim();

        const company = String(
          row[1] ?? ""
        ).trim();

        // Generate a friendly name from email
        const localPart = email.split("@")[0];

        const generatedName = localPart
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) =>
            c.toUpperCase()
          );

        return {
          name: generatedName,
          company,
          email,
          member_type: "Industry",
        };
      })
      .filter((s) => s.email);

    console.log(
      "FIRST SUBSCRIBER:",
      subscribers[0]
    );

    const response = await fetch(
      "/api/subscribers/import",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          subscribers,
        }),
      }
    );

    const result = await response.json();

    alert(
`Import Complete

Spreadsheet Rows: ${result.totalRows}

Imported: ${result.imported}

Already Existing: ${result.skippedExisting}

Duplicates in Spreadsheet: ${result.skippedDuplicate}

Invalid Emails: ${result.skippedInvalid}

Total Subscribers: ${result.totalSubscribers}`
    );

    loadSubscribers();

    // Reset file picker
    event.target.value = "";
  }

  useEffect(() => {
    loadSubscribers();
  }, []);

  /*
   * SUBSCRIBER COUNTS
   */

  const activeCount = subscribers.filter(
    (subscriber) =>
      subscriber.active === true
  ).length;

  const inactiveCount = subscribers.filter(
    (subscriber) =>
      subscriber.active === false
  ).length;

  /*
   * FILTER + SEARCH
   */

  const filteredSubscribers =
    subscribers.filter((subscriber) => {

      // STATUS FILTER

      if (
        statusFilter === "active" &&
        subscriber.active !== true
      ) {
        return false;
      }

      if (
        statusFilter === "inactive" &&
        subscriber.active !== false
      ) {
        return false;
      }

      // SEARCH FILTER

      const searchText = search
        .trim()
        .toLowerCase();

      if (!searchText) {
        return true;
      }

      const subscriberName = String(
        subscriber.name ?? ""
      ).toLowerCase();

      const subscriberCompany = String(
        subscriber.company ?? ""
      ).toLowerCase();

      const subscriberEmail = String(
        subscriber.email ?? ""
      ).toLowerCase();

      return (
        subscriberName.includes(searchText) ||
        subscriberCompany.includes(searchText) ||
        subscriberEmail.includes(searchText)
      );
    });

  return (
    <div className="flex">

      <AdminSidebar />

      <main className="flex-1 bg-slate-100 p-10">

        <h1 className="text-4xl font-bold text-[#1E2D5A]">
          Subscribers
        </h1>

        <p className="mt-2 text-slate-600">
          Manage ASFP newsletter subscribers.
        </p>

        {/* EXCEL FILE INPUT */}

        <input
          id="excelImport"
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={importExcel}
        />

        {/* ADD / IMPORT */}

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold text-[#1E2D5A]">
            Add Subscribers
          </h2>

          <div className="grid gap-4">

            <input
              className="rounded border p-3"
              placeholder="Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <input
              className="rounded border p-3"
              placeholder="Company"
              value={company}
              onChange={(e) =>
                setCompany(e.target.value)
              }
            />

            <input
              className="rounded border p-3"
              placeholder="Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <div className="flex flex-wrap gap-4">

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

        {/* SUBSCRIBER MANAGEMENT */}

        <div className="mt-8 rounded-xl bg-white p-8 shadow">

          {/* HEADER */}

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>

              <h2 className="text-2xl font-bold text-[#1E2D5A]">
                Subscribers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing{" "}
                <strong>
                  {filteredSubscribers.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {subscribers.length}
                </strong>{" "}
                subscribers
              </p>

            </div>

            {/* EXPORT */}

            <div className="flex flex-wrap gap-3">

              <a
                href="/api/subscribers/export?status=active"
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Export Active
              </a>

              <a
                href="/api/subscribers/export?status=inactive"
                className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
              >
                Export Unsubscribed
              </a>

              <a
                href="/api/subscribers/export?status=all"
                className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
              >
                Export All
              </a>

            </div>

          </div>

          {/* FILTERS */}

          <div className="mt-6 rounded-xl border bg-slate-50 p-5">

            <div className="flex flex-wrap gap-3">

              {/* ALL */}

              <button
                type="button"
                onClick={() =>
                  setStatusFilter("all")
                }
                className={`rounded-lg px-5 py-2 font-semibold transition ${
                  statusFilter === "all"
                    ? "bg-[#1E2D5A] text-white"
                    : "border bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                All ({subscribers.length})
              </button>

              {/* ACTIVE */}

              <button
                type="button"
                onClick={() =>
                  setStatusFilter("active")
                }
                className={`rounded-lg px-5 py-2 font-semibold transition ${
                  statusFilter === "active"
                    ? "bg-green-600 text-white"
                    : "border bg-white text-green-700 hover:bg-green-50"
                }`}
              >
                Active ({activeCount})
              </button>

              {/* UNSUBSCRIBED */}

              <button
                type="button"
                onClick={() =>
                  setStatusFilter("inactive")
                }
                className={`rounded-lg px-5 py-2 font-semibold transition ${
                  statusFilter === "inactive"
                    ? "bg-orange-600 text-white"
                    : "border bg-white text-orange-700 hover:bg-orange-50"
                }`}
              >
                Unsubscribed ({inactiveCount})
              </button>

            </div>

            {/* SEARCH */}

            <div className="mt-4">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by name, company or email..."
                className="w-full rounded-lg border bg-white p-3"
              />

            </div>

          </div>

          {/* TABLE */}

          <div className="mt-6 overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="py-3 text-left">
                    Name
                  </th>

                  <th className="py-3 text-left">
                    Company
                  </th>

                  <th className="py-3 text-left">
                    Email
                  </th>

                  <th className="py-3 text-left">
                    Status
                  </th>

                  <th className="py-3 text-left">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredSubscribers.map(
                  (subscriber) => (

                    <tr
                      key={subscriber.id}
                      className="border-b"
                    >

                      <td className="py-3">
                        {subscriber.name}
                      </td>

                      <td className="py-3">
                        {subscriber.company}
                      </td>

                      <td className="py-3">
                        {subscriber.email}
                      </td>

                      <td className="py-3">

                        {subscriber.active ? (

                          <span className="rounded bg-green-100 px-2 py-1 text-green-700">
                            Active
                          </span>

                        ) : (

                          <span className="rounded bg-orange-100 px-2 py-1 text-orange-700">
                            Unsubscribed
                          </span>

                        )}

                      </td>

                      <td className="py-3">

                        {subscriber.active ? (

                          <button
                            onClick={async () => {

                              if (
                                !confirm(
                                  `Delete ${subscriber.email}?`
                                )
                              ) {
                                return;
                              }

                              await fetch(
                                "/api/subscribers/delete",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type":
                                      "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: subscriber.id,
                                  }),
                                }
                              );

                              loadSubscribers();
                            }}
                            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                          >
                            Delete
                          </button>

                        ) : (

                          <button
                            onClick={async () => {

                              const confirmed =
                                confirm(
                                  `Reactivate ${subscriber.email}?`
                                );

                              if (!confirmed) {
                                return;
                              }

                              await fetch(
                                "/api/subscribers/reactivate",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type":
                                      "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: subscriber.id,
                                  }),
                                }
                              );

                              loadSubscribers();
                            }}
                            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                          >
                            Reactivate
                          </button>

                        )}

                      </td>

                    </tr>

                  )
                )}

                {/* NO RESULTS */}

                {filteredSubscribers.length ===
                  0 && (

                  <tr>

                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-500"
                    >
                      No subscribers found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  );
}