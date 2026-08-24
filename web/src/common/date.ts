export function dateToString(date: Date | string | number, precision: "day" | "hour" | "minute" | "second" = "second") {
  if (typeof date === "string" || typeof date === "number") {
    date = new Date(date);
  }

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());

  let result = `${y}/${m}/${d}`;
  if (precision === "hour" || precision === "minute" || precision === "second") {
    result += ` ${dateToTimeString(date)}`;
  }
  return result;
}
export function dateToTimeString(date: Date | string | number, precision: "hour" | "minute" | "second" = "second") {
  if (typeof date === "string" || typeof date === "number") {
    date = new Date(date);
  }

  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  let result = "";
  if (precision === "hour" || precision === "minute" || precision === "second") {
    result += h;
  }
  if (precision === "minute" || precision === "second") {
    result += `:${min}`;
  }
  if (precision === "second") {
    result += `:${s}`;
  }
  return result;
}
const pad = (n: number) => n.toString().padStart(2, "0");

export function parseISODate(input: string = "") {
  if (!input) return undefined;
  const value = new Date(input);
  const IS_ISO = !isNaN(value.getTime());
  if (!IS_ISO) {
    return undefined;
  }
  return value;
}
