import { ExpectType, integer, optional } from "@asla/wokao";

export const ListParamSchema = {
  cursor: optional.string,
  number: optional(integer({ acceptString: true, min: 1, max: 100 })),
  userId: optional(integer.positive),
  post_id: optional(integer.positive),

  group_id: optional(integer({ acceptString: true })),
} satisfies ExpectType;
