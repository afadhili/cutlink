import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Link2,
  QrCode,
  FileText,
  Clock3,
} from "lucide-react";
import { clearHistory, getHistory } from "../lib/history";
import { CopyButton } from "../components/shared/copy-button";
const tools = [
  {
    to: "/links",
    number: "01",
    icon: Link2,
    title: "Shorten a link",
    text: "Long URL? Keep it short, memorable, and ready to go.",
    action: "Create short link",
    className: "mint",
  },
  {
    to: "/qr",
    number: "02",
    icon: QrCode,
    title: "Make a QR code",
    text: "Connect the physical and digital with one simple scan.",
    action: "Generate QR code",
    className: "peach",
  },
  {
    to: "/share",
    number: "03",
    icon: FileText,
    title: "Share some text",
    text: "Give your notes, ideas, and code snippets a link of their own.",
    action: "Create text share",
    className: "lavender",
  },
];
export function Home() {
  const [history, setHistory] = useState(getHistory);
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            <span className="status-dot" /> YOUR EVERYDAY SHARING TOOLKIT
          </p>
          <h1>
            A little less.
            <br />
            <span>A lot more.</span>
          </h1>
          <p className="lede">
            Shorter links. Scannable ideas. Words worth sharing.
            <br className="desktop-break" /> Three simple tools, one tidy space.
          </p>
          <a href="#tools" className="hero-link">
            Make something shareable <ArrowRight size={18} />
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-tag tag-link">
            <Link2 size={26} />
            <span>Less is more.</span>
            <ArrowUpRight size={20} />
          </div>
          <div className="floating-tag tag-qr">
            <QrCode size={82} strokeWidth={1.2} />
            <span>SCAN. CONNECT.</span>
          </div>
          <div className="floating-tag tag-text">
            <FileText size={23} />
            <div className="fake-line" />
            <div className="fake-line short" />
          </div>
          <span className="art-spark">✳</span>
          <span className="art-dot" />
        </div>
      </section>
      <section id="tools" className="tools-section">
        <div className="section-heading">
          <h2>What will you share today?</h2>
          <span>Simple by design.</span>
        </div>
        <div className="tool-cards">
          {tools.map(({ icon: Icon, ...tool }) => (
            <Link
              className={`tool-card ${tool.className}`}
              to={tool.to}
              key={tool.to}
            >
              <div className="card-top">
                <span className="tool-icon">
                  <Icon size={26} />
                </span>
                <span className="tool-number">{tool.number}</span>
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.text}</p>
              <div className="card-action">
                {tool.action}
                <ArrowUpRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="history-section">
        <div className="section-heading">
          <h2>
            <Clock3 size={19} /> Your recent creations
          </h2>
          {history.length > 0 && (
            <button
              className="text-button"
              onClick={() => setConfirmClear(true)}
            >
              Clear history
            </button>
          )}
        </div>
        {confirmClear && (
          <div className="notice">
            <p>
              Clear this browser’s history? Your shared links and text will
              still work.
            </p>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
              <button
                className="button"
                onClick={() => {
                  clearHistory();
                  setHistory(getHistory());
                  setConfirmClear(false);
                }}
              >
                Clear local history
              </button>
            </div>
          </div>
        )}
        {history.length ? (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.url}>
                <span
                  className={`history-icon ${item.type === "link" ? "mint" : "lavender"}`}
                >
                  {item.type === "link" ? (
                    <Link2 size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                </span>
                <div className="history-content">
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                  <span>{item.url}</span>
                </div>
                {item.type === "link" && (
                  <Link
                    className="text-button"
                    to={`/links?slug=${encodeURIComponent(item.slug)}`}
                  >
                    Stats
                  </Link>
                )}
                <CopyButton value={item.url} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="history-empty">
            <span className="empty-icon">
              <Clock3 size={24} />
            </span>
            <div>
              <h3>A fresh start.</h3>
              <p>
                Your recent links and text shares will show up here, saved only
                in this browser.
              </p>
            </div>
            <Link to="/links" className="text-button">
              Create your first link <ArrowRight size={16} />
            </Link>
          </div>
        )}
        <p className="history-note">
          A little convenience, kept on your device.
        </p>
      </section>
    </>
  );
}
