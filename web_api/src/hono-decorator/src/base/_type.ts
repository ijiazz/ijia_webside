interface RouterMeta {
  readonly metadata: Map<any, any>;
}

export interface EndpointMeta extends RouterMeta {
  readonly path: string;
  readonly method?: string;
  readonly key: number | string | symbol;
}
export interface ControllerMeta extends RouterMeta {
  path?: string;
  extends?: boolean;
  /** endpointKey (method+path) -> meta */
  readonly endpoints: Map<string, EndpointMeta>;
  /** controllerKey -> meta */
  readonly endpointsField: Map<number | string | symbol, EndpointMeta>;
}
