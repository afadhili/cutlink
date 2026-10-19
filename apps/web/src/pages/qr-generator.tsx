import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Download, QrCode } from "lucide-react";
import { LIMITS } from "@cutlink/shared/constants";
import {
  generateSvg,
  generatePng,
  downloadFile,
  type Correction,
} from "../features/qr/generate";
import { PageHeading } from "../components/shared/page-heading";
import { CopyButton } from "../components/shared/copy-button";
export function QrGenerator() {
  const [search] = useSearchParams();
  const [text, setText] = useState(
    (search.get("text") || "").slice(0, LIMITS.qr),
  );
  const [size, setSize] = useState(512);
  const [correction, setCorrection] = useState<Correction>("M");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let cancelled = false;
    setSvg("");
    setError("");
    setNotice("");
    const timer = setTimeout(() => {
      if (!text.trim()) return;
      generateSvg(text, size, correction)
        .then((result) => {
          if (!cancelled) setSvg(result);
        })
        .catch(() => {
          if (!cancelled)
            setError(
              "This text is too large for the selected correction level. Shorten it or choose a lower level.",
            );
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, size, correction]);
  async function download(format: "png" | "svg") {
    try {
      if (format === "png")
        downloadFile(
          await generatePng(text, size, correction),
          "cutlink-qr.png",
        );
      else
        downloadFile(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
          "cutlink-qr.svg",
        );
    } catch {
      setError("Could not export this QR code. Try reducing the text length.");
    }
  }
  async function copyImage() {
    try {
      const blob = await (
        await fetch(await generatePng(text, size, correction))
      ).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setNotice("QR image copied.");
    } catch {
      setNotice("Image copying is unavailable. Download the PNG instead.");
    }
  }
  return (
    <>
      <PageHeading eyebrow="02 / QR codes" title="Make anything scannable.">
        From a website to a few words. Turn it into a QR code in seconds.
      </PageHeading>
      <div className="tool-grid">
        <section className="panel">
          <h2>Your content</h2>
          <label>
            Text or URL
            <textarea
              rows={6}
              maxLength={LIMITS.qr}
              placeholder="https://your-great-idea.com"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <p className="field-hint">
            {text.length.toLocaleString()} / {LIMITS.qr.toLocaleString()}{" "}
            characters · generated in your browser
          </p>
          <div className="field-row">
            <label>
              Image size
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              >
                {[128, 256, 512, 1024].map((n) => (
                  <option key={n} value={n}>
                    {n} × {n} px
                  </option>
                ))}
              </select>
            </label>
            <label>
              Error correction
              <select
                value={correction}
                onChange={(e) => setCorrection(e.target.value as Correction)}
              >
                <option value="L">Low · 7%</option>
                <option value="M">Medium · 15%</option>
                <option value="Q">Quartile · 25%</option>
                <option value="H">High · 30%</option>
              </select>
            </label>
          </div>
          {error && (
            <p role="alert" className="notice error">
              {error}
            </p>
          )}
        </section>
        <section className="panel preview-panel">
          <div className="panel-top">
            <h2>Live preview</h2>
            <span className="pill">PNG + SVG</span>
          </div>
          <div className="qr-preview">
            {svg ? (
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
                alt="Generated QR code"
              />
            ) : (
              <div className="empty-preview">
                <QrCode size={72} strokeWidth={1} />
                <p>
                  {text.trim()
                    ? "Preparing your QR code…"
                    : "Your QR code will appear here"}
                </p>
              </div>
            )}
          </div>
          <div className="actions">
            <button
              className="button"
              disabled={!svg}
              onClick={() => download("png")}
            >
              <Download size={16} /> PNG
            </button>
            <button
              className="button secondary"
              disabled={!svg}
              onClick={() => download("svg")}
            >
              <Download size={16} /> SVG
            </button>
            {svg && (
              <button className="button secondary" onClick={copyImage}>
                Copy image
              </button>
            )}
          </div>
          {svg && <CopyButton value={text} label="Copy content" />}
          <p role="status" className="field-hint">
            {notice}
          </p>
        </section>
      </div>
    </>
  );
}
