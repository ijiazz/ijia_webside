export function getUserAvatarPath<T extends string | undefined | null>(id: T): T {
  if (typeof id === "string") return `/file/avatar/${id}` as T;
  return id;
}
