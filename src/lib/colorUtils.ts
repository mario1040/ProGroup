/**
 * Color conversion and CSS sanitization utilities for PDF generation (html2canvas compatibility).
 *
 * Converts modern CSS color functions (oklch, oklab, lab, lch) to standard rgba() colors
 * so that html2canvas and canvas renderers do not crash when parsing stylesheets.
 */

export function oklabToRgba(oklabStr: string): string {
  try {
    const content = oklabStr.replace(/^oklab\(/i, "").replace(/\)$/, "").trim();
    let parts: string[] = [];
    let alpha = "1";

    if (content.includes("/")) {
      const splitSlash = content.split("/");
      alpha = splitSlash[1].trim();
      parts = splitSlash[0].trim().split(/[\s,]+/);
    } else if (content.includes(",")) {
      parts = content.split(",").map(p => p.trim());
      if (parts.length === 4) {
        alpha = parts[3];
        parts = parts.slice(0, 3);
      }
    } else {
      parts = content.split(/\s+/);
    }

    if (parts.length < 3) return "rgba(120, 120, 120, 1)";

    const L_val = parts[0];
    const a_val = parts[1];
    const b_val = parts[2];

    const L = L_val.endsWith("%") ? parseFloat(L_val) / 100 : parseFloat(L_val);
    const okl_a = a_val.endsWith("%") ? (parseFloat(a_val) / 100) * 0.4 : parseFloat(a_val);
    const okl_b = b_val.endsWith("%") ? (parseFloat(b_val) / 100) * 0.4 : parseFloat(b_val);

    const A = alpha.endsWith("%") ? parseFloat(alpha) / 100 : parseFloat(alpha);

    const l_ = L + 0.3963377774 * okl_a + 0.2158037573 * okl_b;
    const m_ = L - 0.1055613458 * okl_a - 0.0638541728 * okl_b;
    const s_ = L - 0.0894841775 * okl_a - 1.2914855480 * okl_b;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    const f = (val: number) => {
      return val > 0.0031308 ? 1.055 * Math.pow(val, 1 / 2.4) - 0.055 : 12.92 * val;
    };

    const rOut = Math.max(0, Math.min(255, Math.round(f(rLinear) * 255)));
    const gOut = Math.max(0, Math.min(255, Math.round(f(gLinear) * 255)));
    const bOut = Math.max(0, Math.min(255, Math.round(f(bLinear) * 255)));

    return `rgba(${rOut}, ${gOut}, ${bOut}, ${isNaN(A) ? 1 : A})`;
  } catch (err) {
    console.error("Failed to parse oklab:", oklabStr, err);
    return "rgba(120, 120, 120, 1)";
  }
}

export function oklchToRgba(oklchStr: string): string {
  try {
    const content = oklchStr.replace(/^oklch\(/i, "").replace(/\)$/, "").trim();
    let parts: string[] = [];
    let alpha = "1";
    
    if (content.includes("/")) {
      const splitSlash = content.split("/");
      alpha = splitSlash[1].trim();
      parts = splitSlash[0].trim().split(/[\s,]+/);
    } else if (content.includes(",")) {
      parts = content.split(",").map(p => p.trim());
      if (parts.length === 4) {
        alpha = parts[3];
        parts = parts.slice(0, 3);
      }
    } else {
      parts = content.split(/\s+/);
    }
    
    if (parts.length < 3) return "rgba(120, 120, 120, 1)";
    
    const L_val = parts[0];
    const C_val = parts[1];
    const H_val = parts[2];
    
    const L = L_val.endsWith("%") ? parseFloat(L_val) / 100 : parseFloat(L_val);
    const C = C_val.endsWith("%") ? (parseFloat(C_val) / 100) * 0.4 : parseFloat(C_val);
    
    let H = 0;
    if (H_val.endsWith("deg")) {
      H = parseFloat(H_val);
    } else if (H_val.endsWith("rad")) {
      H = (parseFloat(H_val) * 180) / Math.PI;
    } else if (H_val.endsWith("turn")) {
      H = parseFloat(H_val) * 360;
    } else {
      H = parseFloat(H_val) || 0;
    }
    
    const A = alpha.endsWith("%") ? parseFloat(alpha) / 100 : parseFloat(alpha);
    
    const hRad = (H * Math.PI) / 180;
    const okl_a = C * Math.cos(hRad);
    const okl_b = C * Math.sin(hRad);
    
    const l_ = L + 0.3963377774 * okl_a + 0.2158037573 * okl_b;
    const m_ = L - 0.1055613458 * okl_a - 0.0638541728 * okl_b;
    const s_ = L - 0.0894841775 * okl_a - 1.2914855480 * okl_b;
    
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    
    const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    
    const f = (val: number) => {
      return val > 0.0031308 ? 1.055 * Math.pow(val, 1 / 2.4) - 0.055 : 12.92 * val;
    };
    
    const rOut = Math.max(0, Math.min(255, Math.round(f(rLinear) * 255)));
    const gOut = Math.max(0, Math.min(255, Math.round(f(gLinear) * 255)));
    const bOut = Math.max(0, Math.min(255, Math.round(f(bLinear) * 255)));
    
    return `rgba(${rOut}, ${gOut}, ${bOut}, ${isNaN(A) ? 1 : A})`;
  } catch (err) {
    console.error("Failed to parse oklch:", oklchStr, err);
    return "rgba(120, 120, 120, 1)";
  }
}

export function sanitizeCssColors(cssText: string): string {
  if (!cssText) return "";
  return cssText
    .replace(/oklch\([^)]+\)/gi, (match) => oklchToRgba(match))
    .replace(/oklab\([^)]+\)/gi, (match) => oklabToRgba(match))
    .replace(/lab\([^)]+\)/gi, (match) => oklabToRgba(match))
    .replace(/lch\([^)]+\)/gi, (match) => oklchToRgba(match));
}
