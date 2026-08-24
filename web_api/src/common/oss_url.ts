export function getUserAvatarPath<T extends string | number | undefined | null>(id: T): T extends number ? string : T {
  if (typeof id === "string" || typeof id === "number") return `/file/avatar/${id}` as any;
  return id as any;
}
