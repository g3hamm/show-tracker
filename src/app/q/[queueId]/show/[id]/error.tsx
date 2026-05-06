"use client";
import { ErrorScreen } from "@/components/ErrorScreen";
export default function Error({ reset }: { reset: () => void }) {
  return <ErrorScreen reset={reset} />;
}
