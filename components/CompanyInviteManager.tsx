"use client";

import { FormEvent, useMemo, useState } from "react";

type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  active: boolean;
  created_at: string;
};

type Invitation = {
  id: string;
  company_id: string;
  contact_name: string;
  contact_email: string;
  token: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  companies: {
    name: string;
    slug: string;
  } | null;
};

export default function CompanyInviteManager({
  initialCompanies,
  initialInvitations,
}: {
  initialCompanies: Company[];
  initialInvitations: Invitation[];
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [invitations, setInvitations] = useState(initialInvitations);

  // New company
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Existing company user invitation
  const [inviteCompany, setInviteCompany] = useState<Company | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userSaving, setUserSaving] = useState(false);

  const [companyAction, setCompanyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const pending = useMemo(
    () => invitations.filter((i) => i.status === "pending"),
    [invitations]
  );

  async function invite(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/company-invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          contactName,
          contactEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Unable to create invitation."
        );
      }

      setCompanies((c) => [...c, data.company]);
      setInvitations((c) => [data.invitation, ...c]);

      setCompanyName("");
      setContactName("");
      setContactEmail("");

      setMessage(
        `Invitation created for ${data.company.name}.`
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Unable to create invitation."
      );
    } finally {
      setSaving(false);
    }
  }

  async function inviteUser(e: FormEvent) {
    e.preventDefault();

    if (!inviteCompany) return;

    setUserSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/company-users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: inviteCompany.id,
          contactName: userName,
          contactEmail: userEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Unable to create user invitation."
        );
      }

      setInvitations((rows) => [
        data.invitation,
        ...rows,
      ]);

      setMessage(
        `Invitation created for ${userName} to join ${inviteCompany.name}.`
      );

      setInviteCompany(null);
      setUserName("");
      setUserEmail("");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Unable to create user invitation."
      );
    } finally {
      setUserSaving(false);
    }
  }

  async function manageCompany(
    c: Company,
    action: "deactivate" | "reactivate" | "delete"
  ) {
    let confirmation: string | undefined;

    if (action === "delete") {
      const required = `DELETE ${c.name.toUpperCase()}`;

      confirmation =
        window.prompt(
          `Permanently delete ${c.name}?\n\nThis permanently removes the company and all associated data.\n\nType ${required} to continue:`
        ) ?? undefined;

      if (confirmation === undefined) return;

      if (confirmation !== required) {
        setMessage(
          `Deletion cancelled. Type ${required} exactly.`
        );
        return;
      }

      if (
        !window.confirm(
          `FINAL WARNING\n\nThis cannot be undone. Permanently delete ${c.name}?`
        )
      ) {
        return;
      }
    } else {
      const label =
        action === "deactivate"
          ? "Deactivate"
          : "Reactivate";

      if (!window.confirm(`${label} ${c.name}?`)) {
        return;
      }
    }

    setCompanyAction(c.id);
    setMessage("");

    try {
      const res = await fetch("/api/companies/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: c.id,
          action,
          confirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Unable to update company."
        );
      }

      if (action === "delete") {
        setCompanies((rows) =>
          rows.filter((row) => row.id !== c.id)
        );

        setInvitations((rows) =>
          rows.filter(
            (row) => row.company_id !== c.id
          )
        );
      } else {
        setCompanies((rows) =>
          rows.map((row) =>
            row.id === c.id
              ? {
                  ...row,
                  active:
                    action === "reactivate",
                }
              : row
          )
        );
      }

      setMessage(data.message);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Unable to update company."
      );
    } finally {
      setCompanyAction(null);
    }
  }

  async function copyLink(i: Invitation) {
    const url =
      `${window.location.origin}/invite/${i.token}`;

    await navigator.clipboard.writeText(url);

    setMessage("Invitation link copied.");
  }

  return (
    <div className="mt-8 space-y-8">
      {message && (
        <div className="rounded-lg border bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {/* CREATE NEW COMPANY */}

      <section className="rounded-xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">
          Invite New Company
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Create a company and a secure seven-day setup
          invitation. No email is sent during this first test
          stage.
        </p>

        <form
          onSubmit={invite}
          className="mt-6 grid gap-4 lg:grid-cols-3"
        >
          <div>
            <label className="text-sm font-semibold">
              Company Name
            </label>

            <input
              value={companyName}
              onChange={(e) =>
                setCompanyName(e.target.value)
              }
              required
              className="mt-2 w-full rounded border p-3"
              placeholder="Example Fire Ltd"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">
              Contact Name
            </label>

            <input
              value={contactName}
              onChange={(e) =>
                setContactName(e.target.value)
              }
              required
              className="mt-2 w-full rounded border p-3"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">
              Contact Email
            </label>

            <input
              type="email"
              value={contactEmail}
              onChange={(e) =>
                setContactEmail(e.target.value)
              }
              required
              className="mt-2 w-full rounded border p-3"
              placeholder="jane@example.co.nz"
            />
          </div>

          <div className="lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Creating..."
                : "Create Invitation"}
            </button>
          </div>
        </form>
      </section>

      {/* PENDING INVITATIONS */}

      <section className="rounded-xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">
          Pending Invitations
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Company and user invitations waiting to be accepted.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3">Company</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Expires</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {pending.map((i) => (
                <tr
                  key={i.id}
                  className="border-b"
                >
                  <td className="py-4">
                    <div className="font-semibold">
                      {i.companies?.name}
                    </div>

                    <div className="text-xs text-slate-500">
                      {i.companies?.slug}
                    </div>
                  </td>

                  <td>
                    <div>{i.contact_name}</div>

                    <div className="text-sm text-slate-500">
                      {i.contact_email}
                    </div>
                  </td>

                  <td className="text-sm">
                    {i.role}
                  </td>

                  <td className="text-sm">
                    {new Date(
                      i.expires_at
                    ).toLocaleString()}
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => copyLink(i)}
                      className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Copy Invite Link
                    </button>
                  </td>
                </tr>
              ))}

              {pending.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-slate-500"
                  >
                    No pending invitations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* COMPANIES */}

      <section className="rounded-xl bg-white p-8 shadow">
        <h2 className="text-2xl font-bold">
          Companies
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border p-5"
            >
              <div className="font-bold">
                {c.name}
              </div>

              <div className="mt-1 text-sm text-slate-500">
                {c.slug}
              </div>

              <div className="mt-4">
                <span
                  className={`rounded px-2 py-1 text-xs font-semibold ${
                    c.active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {c.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`/admin/settings?company=${encodeURIComponent(
                    c.slug
                  )}`}
                  className="rounded bg-slate-800 px-3 py-2 text-sm font-semibold text-white"
                >
                  Manage
                </a>

                {c.active && (
                  <button
                    type="button"
                    onClick={() => {
                      setInviteCompany(c);
                      setUserName("");
                      setUserEmail("");
                      setMessage("");
                    }}
                    className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Invite User
                  </button>
                )}

                <button
                  type="button"
                  disabled={
                    companyAction === c.id
                  }
                  onClick={() =>
                    manageCompany(
                      c,
                      c.active
                        ? "deactivate"
                        : "reactivate"
                    )
                  }
                  className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {c.active
                    ? "Deactivate"
                    : "Reactivate"}
                </button>

                <button
                  type="button"
                  disabled={
                    companyAction === c.id
                  }
                  onClick={() =>
                    manageCompany(
                      c,
                      "delete"
                    )
                  }
                  className="rounded border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INVITE USER TO EXISTING COMPANY */}

      {inviteCompany && (
        <section className="rounded-xl border-2 border-blue-200 bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            Invite User
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Add a user to{" "}
            <strong>{inviteCompany.name}</strong>.
            They will only have access to this company.
          </p>

          <form
            onSubmit={inviteUser}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="text-sm font-semibold">
                Name
              </label>

              <input
                value={userName}
                onChange={(e) =>
                  setUserName(e.target.value)
                }
                required
                className="mt-2 w-full rounded border p-3"
                placeholder="Paul Ryan"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Email
              </label>

              <input
                type="email"
                value={userEmail}
                onChange={(e) =>
                  setUserEmail(e.target.value)
                }
                required
                className="mt-2 w-full rounded border p-3"
                placeholder="paul@example.co.nz"
              />
            </div>

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={userSaving}
                className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {userSaving
                  ? "Creating..."
                  : "Create User Invitation"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setInviteCompany(null)
                }
                className="rounded-lg border px-6 py-3 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}