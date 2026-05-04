export function pruneDirty<T>(value: T, dirtyFields: DirtyValue): DeepPartial<T> | undefined {
  if (typeof dirtyFields === "boolean") {
    return dirtyFields ? (value as DeepPartial<T>) : undefined;
  } else if (dirtyFields instanceof Array) {
    if (!(value instanceof Array)) {
      return undefined;
    }
    if (dirtyFields.some((item) => item)) {
      return value as DeepPartial<T>;
    } else {
      return undefined;
    }
  } else if (typeof dirtyFields === "object") {
    if (typeof value !== "object" || value === null) {
      return undefined;
    }

    const output: any = {};
    let keyLength = 0;
    for (const key in dirtyFields) {
      const result = pruneDirty((value as any)[key], dirtyFields[key] as DirtyValue);
      if (result !== undefined) {
        output[key] = result;
        keyLength++;
      }
    }
    return keyLength > 0 ? output : undefined;
  }
}

type DirtyValues = {
  readonly [key: string]: DirtyValue;
};
type DirtyValue = boolean | DirtyValues | readonly DirtyValues[] | readonly boolean[] | undefined;

type DeepPartial<T> = T extends any[] ? T : T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
