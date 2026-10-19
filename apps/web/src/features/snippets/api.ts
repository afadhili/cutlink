import type {
  CreateSnippet,
  CreatedSnippet,
  SnippetResource,
} from "@cutlink/shared";
import { api } from "../../lib/api-client";
export const createSnippet = (input: CreateSnippet) =>
  api<CreatedSnippet>("/snippets", input);
export const readSnippet = (slug: string) =>
  api<SnippetResource>(`/snippets/${encodeURIComponent(slug)}`);
