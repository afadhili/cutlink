import { describe, expect, it } from 'vitest';
import { generateSvg, qrOptions } from './generate';
describe('QR generation', () => {
  it('generates SVG with configurable size and safely encodes arbitrary text', async () => {
    const svg = await generateSvg('<script>alert(1)</script>', 512, 'H');
    expect(svg).toContain('<svg'); expect(svg).toContain('width="512"'); expect(svg).not.toContain('<script>');
  });
  it('rejects blank, oversized input and invalid dimensions', () => {
    expect(() => qrOptions(' ', 256, 'M')).toThrow();
    expect(() => qrOptions('x'.repeat(2001), 256, 'M')).toThrow();
    expect(() => qrOptions('hello', 1025, 'M')).toThrow();
  });
});
