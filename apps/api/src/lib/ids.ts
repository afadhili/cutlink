import { randomBytes } from "node:crypto";
export const createSlug = () => randomBytes(16).toString("base64url");

// Public short links use compact codes; text shares retain 128-bit identifiers.
export const createLinkSlug = () => randomBytes(6).toString("base64url");
