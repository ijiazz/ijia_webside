export interface RouterMeta {
  useMiddlewares: Function[];
}

export interface EndpointMeta extends RouterMeta {
  readonly path?: string;
  readonly method?: string;

  pipInHandler?: Function;
  pipOutHandler?: Function;
}
export interface ControllerMeta extends RouterMeta {
  path?: string;
  extends?: boolean;
  endpoints: Map<string | Symbol, EndpointMeta>;
}
