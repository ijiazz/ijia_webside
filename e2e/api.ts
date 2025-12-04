export * from "../web_api/src/dto.ts";

export type HttpError = {
  message: string;
  code?: string;
  cause?: any;
};
