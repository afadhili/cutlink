import { randomBytes } from 'node:crypto';
export const createSlug = () => randomBytes(16).toString('base64url');
