export interface RouterMeta {
  useMiddlewares: unknown[];
  pipInHandler?: unknown;
  pipOutHandler?: unknown;
}

export interface EndpointMeta extends RouterMeta {
  readonly path?: string;
  readonly method?: string;
}
export interface ControllerMeta extends RouterMeta {
  path?: string;
  extends?: boolean;
  endpoints: Map<string | Symbol, EndpointMeta>;
}
