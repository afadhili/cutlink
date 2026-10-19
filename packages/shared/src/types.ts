export interface CreateLink {
  originalUrl: string;
  slug?: string;
  expiresAt?: string;
}
export interface LinkResource {
  slug: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
  expiresAt: string | null;
  clickCount: number;
}
export interface CreateSnippet {
  title?: string;
  content: string;
  expiresAt?: string;
  maxViews?: number;
  burnAfterRead?: boolean;
}
export interface CreatedSnippet {
  slug: string;
  shareUrl: string;
}
export interface SnippetResource {
  title: string | null;
  content: string;
  viewCount: number;
  maxViews: number | null;
  burnAfterRead: boolean;
}
export interface ApiError {
  error: { code: string; message: string };
}
