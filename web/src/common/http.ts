import { HoFetch, createFetchSuite } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";
export const http = new HoFetch({ bodyParser: {} });

export const api = createFetchSuite<ApiDefined>(http, { basePath: "/api" });
