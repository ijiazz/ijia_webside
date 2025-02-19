export interface EndpointMeta {
  useMiddlewares: unknown[];
  path?: string;

  method?: string;
}
export interface ControllerMeta {
  useMiddlewares: unknown[];
  path?: string;

  endpoints: Map<string | Symbol, EndpointMeta>;
}
