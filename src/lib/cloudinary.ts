// src/lib/cloudinary.ts
// Cloudinary upload client — replaces Firebase Storage for image uploads

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "kcs6fxei";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "naris_ops_unsigned";

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
}

function base64ToBlob(base64: string, defaultMime = "image/jpeg"): Blob {
  try {
    const arr = base64.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : defaultMime;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("[Cloudinary] Failed to convert Base64 to Blob:", err);
    throw new Error("فشل تحويل الصورة إلى صيغة ملف قابلة للرفع.");
  }
}

export async function uploadToCloudinary(
  blobOrBase64: Blob | string,
  folder: string = "naris_ops"
): Promise<CloudinaryUploadResult> {
  let file: File | Blob;

  if (typeof blobOrBase64 === "string") {
    file = base64ToBlob(blobOrBase64, "image/jpeg");
  } else {
    file = blobOrBase64;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);
  formData.append("tags", "naris-ops,production");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    url: data.url,
    secure_url: data.secure_url,
    public_id: data.public_id,
    format: data.format,
    bytes: data.bytes,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  console.warn(`[Cloudinary] Client-side deletion not supported for unsigned uploads. Public ID to delete manually: ${publicId}`);
}

export function getCloudinaryUrl(
  publicId: string,
  options?: { width?: number; height?: number; quality?: number; format?: string }
): string {
  let transformations = "";
  if (options) {
    const t: string[] = [];
    if (options.width) t.push(`w_${options.width}`);
    if (options.height) t.push(`h_${options.height}`);
    if (options.quality) t.push(`q_${options.quality}`);
    if (options.format) t.push(`f_${options.format}`);
    if (t.length > 0) transformations = t.join(",") + "/";
  }
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}${publicId}`;
}