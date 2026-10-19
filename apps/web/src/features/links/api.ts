import type { CreateLink, LinkResource } from "@cutlink/shared";
import { api } from "../../lib/api-client";
export const createLink = (input: CreateLink) =>
  api<LinkResource>("/links", input);
export const getStats = (slug: string) =>
  api<{ slug: string; clickCount: number }>(
    `/links/${encodeURIComponent(slug)}/stats`,
  );
