import { PrivateMetaDataManage } from "./_MetaDataManage.ts";
import type { ControllerMeta } from "./_type.ts";

export const privateControllerMeta = new PrivateMetaDataManage<ControllerMeta>();

export function getInitDecorateMeta(meta: object): ControllerMeta {
  let controllerMeta = privateControllerMeta.getMetadata(meta);
  if (!controllerMeta) {
    if (typeof meta !== "object") throw new Error("Unable to retrieve metadata");
    controllerMeta = { endpoints: new Map(), useMiddlewares: [] };
    privateControllerMeta.set(meta, controllerMeta);
  }
  return controllerMeta;
}
