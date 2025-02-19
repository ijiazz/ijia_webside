import { Endpoint, EndpointDecorator } from "./decorators/factory.ts";

export function Post(path: string): EndpointDecorator {
  return Endpoint(path, "POST");
}
export function Get(path: string): EndpointDecorator {
  return Endpoint(path, "GET");
}
export function Delete(path: string): EndpointDecorator {
  return Endpoint(path, "DELETE");
}
export function Patch(path: string): EndpointDecorator {
  return Endpoint(path, "PATCH");
}
export function Put(path: string): EndpointDecorator {
  return Endpoint(path, "PUT");
}

export * from "./decorators/factory.ts";
export * from "./decorators/Middleware.ts";
