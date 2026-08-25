"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { REPORT_COPY } from "@/lib/copy";

/**
 * Copy-to-clipboard island for code snippets (design U5 RSC/Client split:
 * TopFindings stays a server presenter; the copy affordance is the client
 * island). Gemini verbatim composition: absolute chip inside the dark code
 * block, swaps to a Check + "Copiado" for 2.5s.
 */
export function CopyCodeButton({
  code,
  ariaLabel = "Copiar código",
}: {
  /** Snippet text to write to the clipboard. */
  code: string;
  /** Accessible name for the button. */
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel}
      className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded bg-slate-800/80 p-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-700"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span className="text-[10px]">
        {copied
          ? REPORT_COPY.findings.copiedCode
          : REPORT_COPY.findings.copyCode}
      </span>
    </button>
  );
}
