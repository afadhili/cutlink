import { useState } from "react";
import { Check, Copy } from "lucide-react";
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied!");
    } catch {
      setStatus("Select the text below and copy it manually.");
    }
  }
  return (
    <span className="copy-control">
      <button type="button" className="button secondary" onClick={copy}>
        {status === "Copied!" ? <Check size={16} /> : <Copy size={16} />}{" "}
        {label}
      </button>
      <span className="sr-only" role="status">
        {status}
      </span>
      {status.startsWith("Select") && (
        <label className="manual-copy">
          {status}
          <textarea
            readOnly
            value={value}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
    </span>
  );
}
