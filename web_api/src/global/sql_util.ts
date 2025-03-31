import { v } from "@ijia/data/yoursql";

export function createSearch(column: string, value: string) {
  return `${column} LIKE ${v("%" + value + "%")}`;
}

/**
 * @example
 * jsonb_build_object({a: true, b: "c"})  // jsonb_build_object('a', a, 'b', c)
 */
export function jsonb_build_object<T extends Record<string, boolean | string>>(map: T, colPrefix?: string): string {
  const keys = Object.entries(map).map(([k, v]) => {
    if (v === true) {
      v = colPrefix ? colPrefix + "." + k : k;
      return `'${k}', ${v}`;
    } else if (typeof v === "string") {
      if (colPrefix) v = colPrefix + "." + v;
      return `'${k}', ${v}`;
    } else throw new Error("jsonb_build_object value must be boolean or string");
  });
  return `jsonb_build_object(${keys.join(", ")})`;
}
