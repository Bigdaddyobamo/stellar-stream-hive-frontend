"use client";

import { isValidRecipientAddress } from "@/lib/stellar";

export interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Recipient address field with inline Stellar G-address validation (56 chars, base32, starts with 'G'). */
export function RecipientInput({ value, onChange }: RecipientInputProps) {
  const touched = value.length > 0;
  const isValid = isValidRecipientAddress(value);

  return (
    <div>
      <label className="label" htmlFor="recipient">
        Recipient address
      </label>
      <input
        id="recipient"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="G..."
        spellCheck={false}
        autoComplete="off"
        className={`input-field font-mono text-sm ${touched && !isValid ? "border-danger focus:border-danger focus:ring-danger" : ""}`}
      />
      {touched && !isValid && (
        <p className="mt-1.5 text-xs text-danger">
          Enter a valid Stellar account address — 56 characters, starting with &quot;G&quot;.
        </p>
      )}
      {touched && isValid && <p className="mt-1.5 text-xs text-primary">Valid Stellar address.</p>}
    </div>
  );
}
