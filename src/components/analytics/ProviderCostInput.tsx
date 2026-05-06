"use client";

import { useState, useTransition } from "react";
import type React from "react";
import { updateProviderMonthlyCost } from "@/lib/families/actions";

interface Props {
  providerId: number;
  initialCost: number | null;
}

export function ProviderCostInput({ providerId, initialCost }: Props) {
  const [value, setValue] = useState(initialCost !== null ? String(initialCost) : "");
  const [pending, startTransition] = useTransition();

  function commit() {
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : parseFloat(trimmed);
    const cost = parsed !== null && !isNaN(parsed) && parsed >= 0 ? parsed : null;
    if (cost === initialCost) return;
    startTransition(async () => {
      await updateProviderMonthlyCost(providerId, cost);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-[color:var(--muted)] text-sm">$</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        placeholder="0.00"
        disabled={pending}
        className="w-20 bg-transparent border-b border-[color:var(--border)] text-sm py-0.5 focus:outline-none focus:border-[color:var(--foreground)] disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-[color:var(--muted)] text-xs">/mo</span>
    </div>
  );
}
