import QRCode from 'qrcode';
import { LIMITS } from '@cutlink/shared/constants';
export type Correction = 'L' | 'M' | 'Q' | 'H';
export function qrOptions(text: string, size: number, correction: Correction) {
  if (!text.trim() || text.length > LIMITS.qr) throw new Error(`Enter between 1 and ${LIMITS.qr} characters.`);
  if (!Number.isInteger(size) || size < 128 || size > 1024) throw new Error('Choose a size between 128 and 1024 pixels.');
  if (!['L', 'M', 'Q', 'H'].includes(correction)) throw new Error('Choose a valid error correction level.');
  return { width: size, margin: 4, errorCorrectionLevel: correction, color: { dark: '#102f2b', light: '#ffffff' } };
}
export const generateSvg = (text: string, size: number, correction: Correction) => QRCode.toString(text, { ...qrOptions(text, size, correction), type: 'svg' });
export const generatePng = (text: string, size: number, correction: Correction) => QRCode.toDataURL(text, qrOptions(text, size, correction));
export function downloadFile(href: string, filename: string) { const anchor = document.createElement('a'); anchor.href = href; anchor.download = filename; anchor.click(); }
