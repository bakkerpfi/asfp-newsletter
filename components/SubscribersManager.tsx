"use client";

import {
  useEffect,
  useState,
} from "react";

import * as XLSX from "xlsx";

type Company = {
  id: string;
  name: string;
  slug: string;
  primary_colour: string;
  secondary_colour: string;
};

type Subscriber = {
  id: number;
  company_id: string;
  name: string | null;
  company: string | null;
  email: string;
  member_type: string | null;
  active: boolean;
};

type Props = {
  currentCompany: Company;
  initialStatus?: string;
};

export default function SubscribersManager({
  currentCompany,
  initialStatus = "all",
}: Props) {
  const [
    subscribers,
    setSubscribers,
  ] = useState<Subscriber[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    initialStatus === "active" ||
      initialStatus === "inactive"
      ? initialStatus
      : "all"
  );

  const [search, setSearch] =
    useState("");

  const [name, setName] =
    useState("");

  const [
    subscriberCompany,
    setSubscriberCompany,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [saving, setSaving] =
    useState(false);

    const [importing, setImporting] =
  useState(false);

  // =====================================================
  // LOAD SUBSCRIBERS
  // =====================================================

  async function loadSubscribers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/subscribers?company=${encodeURIComponent(
          currentCompany.slug
        )}`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load subscribers."
        );
      }

      setSubscribers(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (err) {
      console.error(
        "LOAD SUBSCRIBERS ERROR:",
        err
      );

      setSubscribers([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load subscribers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscribers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCompany.slug]);

  // =====================================================
  // ADD SUBSCRIBER
  // =====================================================

  async function saveSubscriber() {
    if (!email.trim()) {
      alert(
        "Please enter an email address."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/subscribers",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            companySlug:
              currentCompany.slug,

            name,

            company:
              subscriberCompany,

            email,

            member_type:
              "Member",
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Unable to add subscriber."
        );

        return;
      }

      setName("");
      setSubscriberCompany("");
      setEmail("");

      await loadSubscribers();

      alert(
        `Subscriber added successfully to ${currentCompany.name}.`
      );
    } catch (err) {
      console.error(
        "ADD SUBSCRIBER ERROR:",
        err
      );

      alert(
        "Unable to add subscriber."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE SUBSCRIBER
  // =====================================================

  async function deleteSubscriber(
    subscriber: Subscriber
  ) {
    const confirmed =
      confirm(
        `Delete ${subscriber.email} from ${currentCompany.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/subscribers/delete",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id:
              subscriber.id,

            companySlug:
              currentCompany.slug,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Unable to delete subscriber."
        );

        return;
      }

      await loadSubscribers();
    } catch (err) {
      console.error(
        "DELETE SUBSCRIBER ERROR:",
        err
      );

      alert(
        "Unable to delete subscriber."
      );
    }
  }

  // =====================================================
  // DEACTIVATE SUBSCRIBER
  // =====================================================

  async function deactivateSubscriber(
    subscriber: Subscriber
  ) {
    const confirmed =
      confirm(
        `Deactivate ${subscriber.email} for ${currentCompany.name}?\n\nThey will remain in the subscriber list but will no longer receive campaigns.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/subscribers/deactivate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id:
              subscriber.id,
            companySlug:
              currentCompany.slug,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Unable to deactivate subscriber."
        );
        return;
      }

      await loadSubscribers();
    } catch (err) {
      console.error(
        "DEACTIVATE SUBSCRIBER ERROR:",
        err
      );

      alert(
        "Unable to deactivate subscriber."
      );
    }
  }

  // =====================================================
  // REACTIVATE SUBSCRIBER
  // =====================================================

  async function reactivateSubscriber(
    subscriber: Subscriber
  ) {
    const confirmed =
      confirm(
        `Reactivate ${subscriber.email} for ${currentCompany.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/subscribers/reactivate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id:
              subscriber.id,

            companySlug:
              currentCompany.slug,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        alert(
          result.error ||
            "Unable to reactivate subscriber."
        );

        return;
      }

      await loadSubscribers();
    } catch (err) {
      console.error(
        "REACTIVATE SUBSCRIBER ERROR:",
        err
      );

      alert(
        "Unable to reactivate subscriber."
      );
    }
  }

  // =====================================================
// IMPORT EXCEL
// =====================================================

async function importExcel(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  setImporting(true);

  try {
    const buffer =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(buffer);

    const worksheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows =
      XLSX.utils.sheet_to_json<any[]>(
        worksheet,
        {
          header: 1,
        }
      );

    // Existing ASFP spreadsheet format:
    // skip first 4 rows
    // Column A = Email
    // Column B = Company

    const importedSubscribers =
      rows
        .slice(4)
        .map((row: any[]) => {
          const rowEmail =
            String(
              row[0] ?? ""
            ).trim();

          const rowCompany =
            String(
              row[1] ?? ""
            ).trim();

          const localPart =
            rowEmail.split("@")[0];

          const generatedName =
            localPart
              .replace(
                /[._-]+/g,
                " "
              )
              .replace(
                /\b\w/g,
                (character) =>
                  character.toUpperCase()
              );

          return {
            name:
              generatedName,

            company:
              rowCompany,

            email:
              rowEmail,

            member_type:
              "Industry",
          };
        })
        .filter(
          (subscriber) =>
            subscriber.email
        );

    const response =
      await fetch(
        "/api/subscribers/import",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            companySlug:
              currentCompany.slug,

            subscribers:
              importedSubscribers,
          }),
        }
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      alert(
        result.error ||
          "Subscriber import failed."
      );

      return;
    }

    alert(
      `Import Complete â€“ ${currentCompany.name}

Spreadsheet Rows: ${result.totalRows}
Imported: ${result.imported}
Already Existing: ${result.skippedExisting}
Duplicates in Spreadsheet: ${result.skippedDuplicate}
Invalid Emails: ${result.skippedInvalid}
Database Duplicates: ${result.skippedDatabaseDuplicate}
Failed: ${result.failed}
Total Subscribers: ${result.totalSubscribers}`
    );

    await loadSubscribers();
  } catch (err) {
    console.error(
      "IMPORT ERROR:",
      err
    );

    alert(
      "Subscriber import failed."
    );
  } finally {
    setImporting(false);

    event.target.value = "";
  }
}

// =====================================================
// EXPORT URL
// =====================================================

function exportUrl(
  status: string
) {
  return (
    `/api/subscribers/export` +
    `?company=${encodeURIComponent(
      currentCompany.slug
    )}` +
    `&status=${encodeURIComponent(
      status
    )}`
  );
}

  // =====================================================
  // COUNTS
  // =====================================================

  const activeCount =
    subscribers.filter(
      (subscriber) =>
        subscriber.active === true
    ).length;

  const inactiveCount =
    subscribers.filter(
      (subscriber) =>
        subscriber.active === false
    ).length;

  // =====================================================
  // FILTER + SEARCH
  // =====================================================

  const filteredSubscribers =
    subscribers.filter(
      (subscriber) => {
        if (
          statusFilter === "active" &&
          subscriber.active !== true
        ) {
          return false;
        }

        if (
          statusFilter ===
            "inactive" &&
          subscriber.active !== false
        ) {
          return false;
        }

        const searchText =
          search
            .trim()
            .toLowerCase();

        if (!searchText) {
          return true;
        }

        return (
          String(
            subscriber.name ?? ""
          )
            .toLowerCase()
            .includes(searchText) ||
          String(
            subscriber.company ?? ""
          )
            .toLowerCase()
            .includes(searchText) ||
          String(
            subscriber.email ?? ""
          )
            .toLowerCase()
            .includes(searchText)
        );
      }
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <>

      {/* EXCEL IMPORT INPUT */}

      <input
        id="excelImport"
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={importExcel}
      />

      {/* ADD SUBSCRIBER */}

      <div className="mt-8 rounded-xl bg-white p-8 shadow">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h2
              className="text-2xl font-bold"
              style={{
                color:
                  currentCompany.primary_colour,
              }}
            >
              Add Subscriber
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This subscriber will be
              added to{" "}
              <strong>
                {currentCompany.name}
              </strong>
              .
            </p>

          </div>

          <div className="rounded-lg bg-slate-100 px-4 py-3">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Company
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {currentCompany.name}
            </p>

          </div>

        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            placeholder="Name"
            className="rounded-lg border p-3"
          />

          <input
            type="text"
            value={
              subscriberCompany
            }
            onChange={(event) =>
              setSubscriberCompany(
                event.target.value
              )
            }
            placeholder="Company"
            className="rounded-lg border p-3"
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="Email address"
            className="rounded-lg border p-3"
          />

        </div>

<div className="mt-4 flex flex-wrap gap-3">

  <button
    type="button"
    onClick={saveSubscriber}
    disabled={saving || importing}
    className="rounded-lg px-6 py-3 font-semibold text-white disabled:opacity-50"
    style={{
      backgroundColor:
        currentCompany.secondary_colour,
    }}
  >
    {saving
      ? "Adding..."
      : "Add Subscriber"}
  </button>

  <label
    htmlFor="excelImport"
    className={`cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 ${
      importing
        ? "pointer-events-none opacity-50"
        : ""
    }`}
  >
    {importing
      ? "Importing..."
      : "Import Excel"}
  </label>

</div>

      </div>

      {/* SUBSCRIBER LIST */}

      <div className="mt-8 rounded-xl bg-white p-8 shadow">

        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>

            <h2
              className="text-2xl font-bold"
              style={{
                color:
                  currentCompany.primary_colour,
              }}
            >
              Subscribers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {currentCompany.name}
            </p>

          </div>

          <div className="rounded-lg bg-slate-100 px-4 py-3">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Subscribers
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-800">
              {subscribers.length}
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

  <a
    href={exportUrl("active")}
    className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
  >
    Export Active
  </a>

  <a
    href={exportUrl("inactive")}
    className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
  >
    Export Unsubscribed
  </a>

  <a
    href={exportUrl("all")}
    className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
  >
    Export All
  </a>

</div>

        </div>

        {/* FILTER BUTTONS */}

        <div className="mt-6 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "all"
              )
            }
            className={`rounded-lg px-5 py-2 font-semibold ${
              statusFilter === "all"
                ? "text-white"
                : "border bg-white text-slate-700"
            }`}
            style={
              statusFilter === "all"
                ? {
                    backgroundColor:
                      currentCompany.primary_colour,
                  }
                : undefined
            }
          >
            All ({subscribers.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "active"
              )
            }
            className={`rounded-lg px-5 py-2 font-semibold ${
              statusFilter ===
              "active"
                ? "bg-green-600 text-white"
                : "border bg-white text-green-700"
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter(
                "inactive"
              )
            }
            className={`rounded-lg px-5 py-2 font-semibold ${
              statusFilter ===
              "inactive"
                ? "bg-orange-600 text-white"
                : "border bg-white text-orange-700"
            }`}
          >
            Unsubscribed (
            {inactiveCount})
          </button>

        </div>

        {/* SEARCH */}

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search by name, company or email..."
          className="mt-4 w-full rounded-lg border bg-white p-3"
        />

        {/* ERROR */}

        {error && (

          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>

        )}

        {/* LOADING / TABLE */}

        {loading ? (

          <div className="py-12 text-center text-slate-500">
            Loading subscribers...
          </div>

        ) : (

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
                      key={
                        subscriber.id
                      }
                      className="border-b"
                    >

                      <td className="py-3">
                        {
                          subscriber.name
                        }
                      </td>

                      <td className="py-3">
                        {
                          subscriber.company
                        }
                      </td>

                      <td className="py-3">
                        {
                          subscriber.email
                        }
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

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                deactivateSubscriber(
                                  subscriber
                                )
                              }
                              className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                            >
                              Deactivate
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteSubscriber(
                                  subscriber
                                )
                              }
                              className="rounded border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>

                          </div>

                        ) : (

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                reactivateSubscriber(
                                  subscriber
                                )
                              }
                              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                            >
                              Reactivate
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteSubscriber(
                                  subscriber
                                )
                              }
                              className="rounded border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>

                          </div>

                        )}

                      </td>

                    </tr>

                  )
                )}

                {filteredSubscribers.length ===
                  0 && (

                  <tr>

                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-500"
                    >
                      No subscribers found
                      for{" "}
                      {
                        currentCompany.name
                      }
                      .
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>
    </>
  );
}
