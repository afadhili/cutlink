import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, FileText } from "lucide-react";
import { LIMITS } from "@cutlink/shared/constants";
import { createSnippet } from "../features/snippets/api";
import { PageHeading } from "../components/shared/page-heading";
import { CopyButton } from "../components/shared/copy-button";
import { ErrorMessage } from "../components/shared/feedback";
import { remember } from "../lib/history";
import { expiryValue } from "../lib/forms";
export function TextShare() {
  const [burn, setBurn] = useState(false);
  const mutation = useMutation({
    mutationFn: createSnippet,
    onSuccess: (result, input) =>
      remember({
        type: "text",
        url: result.shareUrl,
        label: input.title || "Untitled text",
        slug: result.slug,
        createdAt: new Date().toISOString(),
      }),
  });
  return (
    <>
      <PageHeading eyebrow="03 / Text sharing" title="A space for your words.">
        Code snippets, quick notes, and everything in between. Write it. Link
        it. Share it.
      </PageHeading>
      <div className="tool-grid">
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            mutation.mutate({
              title: String(data.get("title") || "") || undefined,
              content: String(data.get("content")),
              expiresAt: expiryValue(data.get("expires")),
              maxViews:
                !burn && data.get("views")
                  ? Number(data.get("views"))
                  : undefined,
              burnAfterRead: burn,
            });
          }}
        >
          <label>
            Title <span className="optional">optional</span>
            <input
              name="title"
              maxLength={LIMITS.title}
              placeholder="Give your words a name"
            />
          </label>
          <label>
            Your text
            <textarea
              name="content"
              className="text-editor"
              rows={10}
              required
              maxLength={LIMITS.content}
              placeholder="A thought, a snippet, a little something to share…"
            />
          </label>
          <div className="field-row">
            <label>
              Expires on <span className="optional">optional</span>
              <input name="expires" type="datetime-local" />
            </label>
            <label>
              Maximum reads <span className="optional">optional</span>
              <input
                name="views"
                type="number"
                min={1}
                max={1000000}
                disabled={burn}
                placeholder={burn ? "One read" : "Unlimited"}
              />
            </label>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={burn}
              onChange={(e) => setBurn(e.target.checked)}
            />
            <span>
              Burn after reading
              <small>
                Delete the text after its first successful retrieval.
              </small>
            </span>
          </label>
          <ErrorMessage error={mutation.error} />
          <button className="button wide" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating share…" : "Create text share"}
            <ArrowRight size={18} />
          </button>
        </form>
        <aside className="panel result-panel">
          <span className="result-icon">
            <FileText />
          </span>
          {mutation.data ? (
            <>
              <p className="eyebrow">Ready to share</p>
              <h2>Your words have a home.</h2>
              <a className="result-url" href={mutation.data.shareUrl}>
                {mutation.data.shareUrl}
              </a>
              <CopyButton
                value={mutation.data.shareUrl}
                label="Copy share link"
              />
              <p className="field-hint">
                Opening the page won’t use a read. Selecting “Reveal text” will.
              </p>
            </>
          ) : (
            <>
              <h2>Just the text. Just a link.</h2>
              <p className="muted">
                No sign-ups or attachments. Share something useful with one
                simple URL.
              </p>
            </>
          )}
          <div className="tip">
            <strong>A note on sharing</strong>
            <p>
              Anyone with the link can read your text. Read limits control
              retrieval, but cannot prevent someone from saving a copy.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
