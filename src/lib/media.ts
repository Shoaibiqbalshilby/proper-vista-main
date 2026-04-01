import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") || "";

const isAbsoluteHttp = (value: string) => /^https?:\/\//i.test(value);
const isBlobOrFile = (value: string) => /^(blob:|file:)/i.test(value);
const isDataUrl = (value: string) => /^data:/i.test(value);

const tryBuildSupabasePublicUrl = (value: string): string | null => {
  // Handles values like "bucket/path/to/file.jpg"
  const clean = value.replace(/^\/+/, "").trim();
  const slashIndex = clean.indexOf("/");
  if (slashIndex < 1) return null;

  const bucket = clean.slice(0, slashIndex);
  const path = clean.slice(slashIndex + 1);
  if (!bucket || !path) return null;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export const normalizeMediaUrls = (rawUrls: unknown): string[] => {
  const input = Array.isArray(rawUrls) ? rawUrls : [];
  const normalized: string[] = [];

  for (const raw of input) {
    if (typeof raw !== "string") continue;

    const value = raw.trim();
    if (!value || isBlobOrFile(value)) continue;

    if (isAbsoluteHttp(value) || isDataUrl(value)) {
      normalized.push(value);
      continue;
    }

    // Handles "/storage/v1/object/public/bucket/path"
    if (value.startsWith("/storage/v1/object/public/") && SUPABASE_URL) {
      normalized.push(`${SUPABASE_URL}${value}`);
      continue;
    }

    // Handles "storage/v1/object/public/bucket/path"
    if (value.startsWith("storage/v1/object/public/") && SUPABASE_URL) {
      normalized.push(`${SUPABASE_URL}/${value}`);
      continue;
    }

    const publicUrl = tryBuildSupabasePublicUrl(value);
    if (publicUrl) normalized.push(publicUrl);
  }

  const uniqueUrls = Array.from(new Set(normalized));
  return uniqueUrls.length > 0 ? uniqueUrls : ["/placeholder.svg"];
};
