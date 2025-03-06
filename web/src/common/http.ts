import { HoFetch, createFetchSuite } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";
export const http = new HoFetch({ bodyParser: {} });

export const API_PREFIX = "/api";
export const api = createFetchSuite<ApiDefined>(http, { basePath: API_PREFIX });
