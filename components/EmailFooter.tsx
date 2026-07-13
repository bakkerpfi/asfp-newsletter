export default function EmailFooter({
  unsubscribeUrl,
}: {
  unsubscribeUrl: string;
}) {
  return (
    <div
      style={{
        marginTop: "40px",
        borderTop: "1px solid #d1d5db",
        paddingTop: "30px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#555",
        lineHeight: "1.7",
      }}
    >
      <h3
        style={{
          color: "#1E2D5A",
          marginBottom: "10px",
        }}
      >
        ASFP Australia & New Zealand Branch
      </h3>

      <p>
        Keeping the passive fire protection industry informed through
        education, technical guidance and collaboration.
      </p>

      <p>
        Website:
        <br />
        https://www.asfp.org.au
      </p>

      <p>
        You are receiving this email because you subscribed to
        updates from the ASFP Australia & New Zealand Branch.
      </p>

      <p>
        If you no longer wish to receive newsletters you may unsubscribe
        at any time.
      </p>

      <p>
        <a
          href={unsubscribeUrl}
          style={{
            color: "#d62828",
            fontWeight: "bold",
          }}
        >
          Unsubscribe from future newsletters
        </a>
      </p>

      <hr />

      <p
        style={{
          fontSize: "12px",
          color: "#888",
        }}
      >
        © {new Date().getFullYear()} ASFP Australia & New Zealand Branch.
        All rights reserved.
      </p>
    </div>
  );
}