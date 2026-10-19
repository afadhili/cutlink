// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { SnippetView } from "./snippet-view";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("only consumes a read on explicit reveal and renders hostile HTML as text", async () => {
  const content = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        title: "A note",
        content,
        viewCount: 1,
        maxViews: 1,
        burnAfterRead: true,
      }),
      { headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/t/test"]}>
          <Routes>
            <Route path="/t/:slug" element={<SnippetView />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Reveal text" }));
  expect(await screen.findByText(content)).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(document.querySelector("pre img")).toBeNull();
  expect(document.querySelector("pre script")).toBeNull();
  expect(screen.getByText(/deleted from the server/)).toBeTruthy();
});
it("shows network errors without automatic retry", async () => {
  const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/t/test"]}>
        <Routes>
          <Route path="/t/:slug" element={<SnippetView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Reveal text" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Cannot reach the server",
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
