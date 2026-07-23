export * from "@ijia/api-types";

export type HttpError = {
  message: string;
  code?: string;
  cause?: any;
};
