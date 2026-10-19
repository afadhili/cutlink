import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router";
import { FileText } from "lucide-react";
import { readSnippet } from "../features/snippets/api";
import { PageHeading } from "../components/shared/page-heading";
import { CopyButton } from "../components/shared/copy-button";
import { ErrorMessage } from "../components/shared/feedback";
function Viewer({ slug }: { slug: string }) {
  const read = useMutation({
    mutationFn: () => readSnippet(slug),
    retry: false,
    gcTime: 0,
  });
  return (
    <>
      <PageHeading
        eyebrow="Shared text"
        title={read.data?.title || "Something to share."}
      >
        A small space for someone’s words.
      </PageHeading>
      <section className="panel snippet-panel">
        {read.data ? (
          <>
            <div className="panel-top">
              <span className="pill">Plain text</span>
              <CopyButton value={read.data.content} label="Copy text" />
            </div>
            {read.data.burnAfterRead && (
              <p className="notice">
                This text has been deleted from the server. Save a copy before
                leaving this page.
              </p>
            )}
            <pre className="shared-text">{read.data.content}</pre>
            <p className="field-hint">
              Read {read.data.viewCount}
              {read.data.maxViews ? ` of ${read.data.maxViews}` : ""}
            </p>
          </>
        ) : (
          <div className="reveal">
            <span className="result-icon">
              <FileText />
            </span>
            <h2>Ready when you are.</h2>
            <p>
              Revealing this text uses one read. If it’s a one-time share, the
              text will be deleted from the server when retrieved.
            </p>
            <button
              className="button"
              disabled={read.isPending}
              onClick={() => read.mutate()}
            >
              {read.isPending
                ? "Opening…"
                : read.isError
                  ? "Try revealing again"
                  : "Reveal text"}
            </button>
            <ErrorMessage error={read.error} />
          </div>
        )}
      </section>
    </>
  );
}
export function SnippetView() {
  const { slug = "" } = useParams();
  return <Viewer key={slug} slug={slug} />;
}
