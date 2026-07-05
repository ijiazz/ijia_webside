export function formatTimeToString(ms: number, minPrecision: FormatTimePrecision = "second") {
  let s = Math.floor(ms / 1000);
  ms = ms % 1000;
  let m = Math.floor(s / 60);
  s = s % 60;
  let h = Math.floor(m / 60);
  m = m % 60;

  let base: string[] = [];

  base.push(`${h.toString().padStart(2, "0")}`);
  if (minPrecision === "hour") return base.join(":");

  base.push(`${m.toString().padStart(2, "0")}`);
  if (minPrecision === "minute") return base.join(":");

  base.push(`${s.toString().padStart(2, "0")}`);
  if (minPrecision === "second") return base.join(":");

  return base.join(":") + `.${ms.toString().padStart(3, "0")}`;
}
type FormatTimePrecision = "hour" | "minute" | "second" | "ms";
