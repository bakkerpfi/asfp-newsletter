import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

console.log(
  "RESEND KEY:",
  process.env.RESEND_API_KEY?.substring(0, 12)
);

const resend = new Resend(process.env.RESEND_API_KEY);

export type RecoveryLog = {
  logId: string;
};

export type RecoveryRecipient = {
  logId: string;
  email: string;
};

export type MatchedSubscriber = {
  id: number;
  name: string | null;
  email: string;
  unsubscribe_token: string;
};

export async function readRecoveryCsv(): Promise<RecoveryLog[]> {
  const csvPath = path.join(
    process.cwd(),
    "private",
    "resend-429-logs.csv"
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(
      `CSV not found: ${csvPath}`
    );
  }

  return new Promise((resolve, reject) => {
    const rows: RecoveryLog[] = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.id) {
          rows.push({
            logId: String(row.id).trim(),
          });
        }
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

export async function retrieveRecipient(
  logId: string
): Promise<RecoveryRecipient | null> {
  try {
    const { data, error } = await resend.logs.get(logId);

    if (error || !data) {
      console.error(
        `Failed to retrieve log ${logId}:`,
        error
      );
      return null;
    }

    const requestBody = (data as any).request_body;

    if (!requestBody?.to) {
      return null;
    }

    const to = Array.isArray(requestBody.to)
      ? requestBody.to[0]
      : requestBody.to;

    return {
      logId,
      email: String(to).toLowerCase().trim(),
    };
  } catch (err) {
    console.error(
      `Error retrieving log ${logId}:`,
      err
    );

    return null;
  }
}

export async function loadSubscribersByEmail(
  emails: string[]
): Promise<MatchedSubscriber[]> {
  if (emails.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("subscribers")
    .select(
      "id,name,email,unsubscribe_token"
    )
    .in("email", emails);

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data as MatchedSubscriber[]) ?? []
  );
}

export function uniqueEmails(
  recipients: RecoveryRecipient[]
) {
  return [
    ...new Set(
      recipients.map((r) => r.email)
    ),
  ];
}
export async function buildRecovery() {

  console.log("Reading recovery CSV...");

  const logs = await readRecoveryCsv();

  console.log(`Found ${logs.length} log IDs`);

  const recoveredRecipients: RecoveryRecipient[] = [];

  for (const log of logs) {

    const recipient = await retrieveRecipient(log.logId);

    if (recipient) {
      recoveredRecipients.push(recipient);
    }

  }

  const emails = uniqueEmails(recoveredRecipients);

  const subscribers =
    await loadSubscribersByEmail(emails);

  const matchedEmails = new Set(
    subscribers.map((s) => s.email.toLowerCase())
  );

  const unmatched = emails.filter(
    (email) => !matchedEmails.has(email)
  );

  return {

    summary: {
      csvLogIds: logs.length,
      logsRetrieved: recoveredRecipients.length,
      uniqueEmails: emails.length,
      matchedSubscribers: subscribers.length,
      unmatchedEmails: unmatched.length,
    },

    subscribers,
    unmatched,
    recoveredRecipients,

  };
}