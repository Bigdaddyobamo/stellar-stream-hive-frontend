"use client";

import { nativeTokenContractId, isValidStellarAddress } from "@/lib/stellar";
import type { TokenInfo } from "@/types";

export interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  token: TokenInfo;
  onTokenChange: (token: TokenInfo) => void;
}

const XLM_TOKEN: TokenInfo = { contractId: nativeTokenContractId(), symbol: "XLM", decimals: 7 };

/** Total amount field plus a token selector (native XLM or a custom Stellar Asset Contract). */
export function AmountInput({ amount, onAmountChange, token, onTokenChange }: AmountInputProps) {
  const isCustomToken = token.contractId !== XLM_TOKEN.contractId;
  const amountIsValid = amount === "" || (/^\d*\.?\d*$/.test(amount) && Number(amount) >= 0);

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="amount">
          Total amount
        </label>
        <div className="flex gap-2">
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className={`input-field flex-1 ${!amountIsValid ? "border-danger" : ""}`}
          />
          <select
            value={isCustomToken ? "custom" : "xlm"}
            onChange={(e) => {
              if (e.target.value === "xlm") {
                onTokenChange(XLM_TOKEN);
              } else {
                onTokenChange({ contractId: "", symbol: "", decimals: 7 });
              }
            }}
            className="input-field w-32 shrink-0"
          >
            <option value="xlm">XLM</option>
            <option value="custom">Custom token</option>
          </select>
        </div>
        {!amountIsValid && <p className="mt-1.5 text-xs text-danger">Enter a valid, non-negative number.</p>}
      </div>

      {isCustomToken && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="label" htmlFor="token-contract">
              Token contract ID
            </label>
            <input
              id="token-contract"
              type="text"
              value={token.contractId}
              onChange={(e) => onTokenChange({ ...token, contractId: e.target.value.trim() })}
              placeholder="C..."
              spellCheck={false}
              className={`input-field font-mono text-sm ${
                token.contractId && !isValidStellarAddress(token.contractId, "contract") ? "border-danger" : ""
              }`}
            />
          </div>
          <div>
            <label className="label" htmlFor="token-symbol">
              Symbol
            </label>
            <input
              id="token-symbol"
              type="text"
              value={token.symbol}
              onChange={(e) => onTokenChange({ ...token, symbol: e.target.value.toUpperCase().slice(0, 12) })}
              placeholder="USDC"
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="token-decimals">
              Decimals
            </label>
            <input
              id="token-decimals"
              type="number"
              min={0}
              max={18}
              value={token.decimals}
              onChange={(e) => onTokenChange({ ...token, decimals: Math.min(18, Math.max(0, Number(e.target.value))) })}
              className="input-field"
            />
          </div>
        </div>
      )}
    </div>
  );
}
