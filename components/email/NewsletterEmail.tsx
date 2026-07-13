interface Props {
  name: string;
  newsletterUrl: string;
  unsubscribeUrl: string;
}

export default function NewsletterEmail({
  name,
  newsletterUrl,
  unsubscribeUrl,
}: Props) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto">

    <img
      src="https://asfp-newsletter.vercel.app/AustraliaNewZealand-02.png"
      width="180"
      alt="ASFP"
    />

    <h2 style="color:#1E2D5A">
      Hello ${name},
    </h2>

    <p>
      The latest <strong>ASFP Australia & New Zealand Industry Update</strong>
      is now available.
    </p>

    <p>
      This issue includes:
    </p>

    <ul>
      <li>Industry Updates</li>
      <li>Technical Articles</li>
      <li>Member News</li>
      <li>Industry Polls</li>
    </ul>

    <p style="margin-top:30px">

      <a
        href="${newsletterUrl}"
        style="
          background:#1E2D5A;
          color:white;
          padding:14px 24px;
          text-decoration:none;
          border-radius:6px;
          font-weight:bold;
        "
      >
        Read Newsletter
      </a>

    </p>

    <hr style="margin:40px 0">

    <p style="font-size:14px;color:#666">

      Regards

      <br><br>

      <strong>Paul Robertson</strong><br>
      Managing Director<br>
      ASFP Australia & New Zealand

    </p>

    <hr>

    <p style="font-size:12px;color:#777">

      You are receiving this email because you subscribed to receive
      ASFP Australia & New Zealand updates.

    </p>

    <p>

      <a href="${unsubscribeUrl}">
        Unsubscribe
      </a>

    </p>

  </div>
  `;
}