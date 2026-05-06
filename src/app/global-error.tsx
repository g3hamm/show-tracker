"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#000", color: "#fff", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: "2rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/chillflix-logo.png" alt="Chillflix" style={{ width: 180, opacity: 0.85, marginBottom: "1.5rem" }} />
        <p style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something very UNCHILL just occurred.</p>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem" }}>A server error occurred. Try again or head back to the dashboard.</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={reset} style={{ padding: "0.5rem 1rem", background: "#C01900", color: "#fff", border: "none", borderRadius: "0.375rem", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: "0.375rem", fontWeight: 600, textDecoration: "none" }}>
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
