export interface EndpointMeta {
  useMiddlewares: unknown[];
  readonly path?: string;
  readonly method?: string;
}
export interface ControllerMeta {
  useMiddlewares: unknown[];
  path?: string;

  endpoints: Map<string | Symbol, EndpointMeta>;
}
