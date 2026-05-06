"use client";

import { ErrorScreen } from "@/components/ErrorScreen";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body>
        <ErrorScreen reset={reset} />
      </body>
    </html>
  );
}
