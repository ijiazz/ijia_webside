import { jsonb_build_object } from "@/global/sql_util.ts";

export function getPostContentType(key: string) {
  return jsonb_build_object({
    hasText: `get_bit(${key},7)::BOOL`,
    hasImage: `get_bit(${key},6)::BOOL`,
    hasAudio: `get_bit(${key},5)::BOOL`,
    hasVideo: `get_bit(${key},4)::BOOL`,
  });
}
