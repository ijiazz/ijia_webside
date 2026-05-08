/* @__NO_SIDE_EFFECTS__ */
export function dateToString(date: Date | string | number, precision: "day" | "hour" | "minute" | "second" = "second") {
  if (typeof date === "string" || typeof date === "number") {
    date = new Date(date);
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());

  let result = `${y}/${m}/${d}`;
  if (precision === "hour" || precision === "minute" || precision === "second") {
    result += ` ${h}`;
  }
  if (precision === "minute" || precision === "second") {
    result += `:${min}`;
  }
  if (precision === "second") {
    result += `:${s}`;
  }
  return result;
}

/* @__NO_SIDE_EFFECTS__ */
export function parseISODate(input: string = "") {
  const IS_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(input);
  if (!IS_ISO) {
    return undefined;
  }
  return new Date(input);
}
