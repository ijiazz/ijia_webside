export function isEqual(obj1: any, obj2: any) {
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object" || obj1 === null || obj2 === null) return obj1 === obj2;

  if (obj1 instanceof Array) {
    if (obj2 instanceof Array) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!isEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }
    return false;
  } else {
    const key1 = Object.keys(obj1);
    const key2 = Object.keys(obj2);
    if (key2.length !== key1.length) return false;
    const key2Set = new Set(key2);
    for (const key of key1) {
      if (!key2Set.has(key)) {
        if (key === undefined) continue;
        return false;
      }
      if (!isEqual(obj1[key], obj2[key])) return false;
      key2Set.delete(key);
    }
    if (key2Set.size) return false;
    return true;
  }
}
