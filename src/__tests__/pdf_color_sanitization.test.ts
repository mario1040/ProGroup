import { describe, it, expect } from 'vitest';
import { oklabToRgba, oklchToRgba, sanitizeCssColors } from '../lib/colorUtils';

describe('PDF Export CSS Color Sanitizer (oklab & oklch support)', () => {
  it('should convert oklab color with space separation to valid rgba', () => {
    const oklab = 'oklab(0.9 0 0)';
    const rgba = oklabToRgba(oklab);
    expect(rgba).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*1\)$/);
  });

  it('should convert oklab with alpha slash to valid rgba with alpha', () => {
    const oklab = 'oklab(0.85 0.05 -0.02 / 0.75)';
    const rgba = oklabToRgba(oklab);
    expect(rgba).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\.75\)$/);
  });

  it('should convert oklab with percentage values', () => {
    const oklab = 'oklab(80% 10% -5% / 80%)';
    const rgba = oklabToRgba(oklab);
    expect(rgba).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\.8\)$/);
  });

  it('should convert oklch color to valid rgba', () => {
    const oklch = 'oklch(0.6 0.25 240)';
    const rgba = oklchToRgba(oklch);
    expect(rgba).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*1\)$/);
  });

  it('should convert oklch color with slash alpha', () => {
    const oklch = 'oklch(0.7 0.15 120deg / 0.5)';
    const rgba = oklchToRgba(oklch);
    expect(rgba).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*0\.5\)$/);
  });

  it('should sanitize mixed CSS containing oklab and oklch', () => {
    const rawCss = `
      :root {
        --primary: oklab(0.9 0 0);
        --accent: oklch(0.7 0.15 180);
        --bg-trans: oklab(0.95 0.01 0.02 / 0.8);
      }
      .card {
        background-color: oklab(0.85 -0.05 0.1);
        border-color: oklch(0.5 0.2 280 / 0.9);
      }
    `;

    const sanitized = sanitizeCssColors(rawCss);

    expect(sanitized).not.toContain('oklab(');
    expect(sanitized).not.toContain('oklch(');
    expect(sanitized).toContain('rgba(');
  });

  it('should safely return fallback rgba on malformed color strings', () => {
    expect(oklabToRgba('oklab(invalid)')).toBe('rgba(120, 120, 120, 1)');
    expect(oklchToRgba('oklch(invalid)')).toBe('rgba(120, 120, 120, 1)');
  });
});
