interface RouterMeta {
  readonly metadata: Map<any, any>;
}

export interface EndpointMeta extends RouterMeta {
  readonly path?: string;
  readonly method?: string;
  readonly key: number | string | symbol;
}
export interface ControllerMeta extends RouterMeta {
  path?: string;
  extends?: boolean;
  /** controllerKey -> meta */
  readonly endpoints: Map<string, EndpointMeta>;
  readonly endpointsField: Map<number | string | symbol, EndpointMeta>;
}
