export * from "../web_api/src/api.ts";

export type HttpError = {
  message: string;
  code?: string;
  cause?: any;
};
