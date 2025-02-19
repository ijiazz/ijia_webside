const SymbolMetadata = Symbol.metadata ?? Symbol("Symbol.metadata");

export class PrivateMetaDataManage<V> {
  #map = new WeakMap<object, V>();
  getMetadata(meta: object) {
    return this.#map.get(meta);
  }
  set(key: object, value: V) {
    this.#map.set(key, value);
  }
  getClassMetadata(Class: Function) {
    const metadata = Reflect.get(Class, SymbolMetadata);
    if (metadata) return this.#map.get(metadata);
    return;
  }
  getObjectMetadata(obj: object) {
    const proto = Reflect.getPrototypeOf(obj);
    if (!proto) return;
    return this.getClassMetadata(proto.constructor);
  }
}
