import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, Link2, QrCode, RefreshCw } from "lucide-react";
import { LIMITS } from "@cutlink/shared/constants";
import { createLink, getStats } from "../features/links/api";
import { PageHeading } from "../components/shared/page-heading";
import { CopyButton } from "../components/shared/copy-button";
import { ErrorMessage } from "../components/shared/feedback";
import { remember } from "../lib/history";
import { expiryValue } from "../lib/forms";
export function Links() {
  const [search] = useSearchParams();
  const mutation = useMutation({
    mutationFn: createLink,
    onSuccess: (link) =>
      remember({
        type: "link",
        url: link.shortUrl,
        label: link.originalUrl,
        slug: link.slug,
        createdAt: link.createdAt,
      }),
  });
  const slug = mutation.data?.slug || search.get("slug") || "";
  const stats = useQuery({
    queryKey: ["stats", slug],
    queryFn: () => getStats(slug),
    enabled: !!slug,
  });
  return (
    <>
      <PageHeading
        eyebrow="01 / Short links"
        title="Less link. More possibility."
      >
        Give your long URLs a short, memorable place to call home.
      </PageHeading>
      <div className="tool-grid">
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            mutation.mutate({
              originalUrl: String(data.get("url")),
              slug: String(data.get("slug") || "") || undefined,
              expiresAt: expiryValue(data.get("expires")),
            });
          }}
        >
          <h2>Create a short link</h2>
          <label>
            Destination URL
            <input
              name="url"
              type="url"
              required
              maxLength={LIMITS.url}
              placeholder="https://your-very-long-link.com/something-great"
            />
          </label>
          <label>
            Custom slug <span className="optional">optional</span>
            <input
              name="slug"
              minLength={3}
              maxLength={64}
              pattern="[A-Za-z0-9_-]+"
              placeholder="my-great-idea"
            />
          </label>
          <p className="field-hint">
            3–64 letters, numbers, hyphens or underscores.
          </p>
          <label>
            Expires on <span className="optional">optional</span>
            <input name="expires" type="datetime-local" />
          </label>
          <ErrorMessage error={mutation.error} />
          <button className="button wide" disabled={mutation.isPending}>
            {mutation.isPending ? "Shortening…" : "Shorten link"}
            <ArrowRight size={18} />
          </button>
        </form>
        <aside className="panel result-panel">
          {mutation.data ? (
            <>
              <span className="result-icon">
                <Link2 />
              </span>
              <p className="eyebrow">Ready to share</p>
              <h2>A little link, made for you.</h2>
              <a
                className="result-url"
                href={mutation.data.shortUrl}
                target="_blank"
                rel="noreferrer"
              >
                {mutation.data.shortUrl}
              </a>
              <div className="actions">
                <CopyButton value={mutation.data.shortUrl} label="Copy link" />
                <Link
                  className="button secondary"
                  to={`/qr?text=${encodeURIComponent(mutation.data.shortUrl)}`}
                >
                  <QrCode size={16} /> Make QR
                </Link>
              </div>
              <p className="field-hint">
                {mutation.data.expiresAt
                  ? `Expires ${new Date(mutation.data.expiresAt).toLocaleString()}`
                  : "No expiration set"}
              </p>
            </>
          ) : (
            <>
              <span className="result-icon">
                <Link2 />
              </span>
              <h2>Good things come in short links.</h2>
              <p className="muted">
                Create a link, copy it, and share it anywhere. We’ll keep count
                of the visits.
              </p>
              <div className="link-example">
                <span>your-website.com/a/very/long/link</span>
                <ArrowRight size={18} />
                <strong>cutlink / your-idea</strong>
              </div>
            </>
          )}
          {slug && (
            <div className="stats-box">
              <div>
                <span className="eyebrow">Total clicks</span>
                <strong>{stats.data?.clickCount ?? "—"}</strong>
                <small>{slug}</small>
              </div>
              <button
                type="button"
                className="button secondary"
                onClick={() => stats.refetch()}
                disabled={stats.isFetching}
              >
                <RefreshCw size={15} /> Refresh
              </button>
              <ErrorMessage error={stats.error} />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
