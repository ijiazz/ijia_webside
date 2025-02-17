import { HoFetch } from "@asla/hofetch";
import { ApiDefined } from "@/api.ts";
export const http = new HoFetch({ bodyParser: {} });

export const api = http.createFetchSuite<ApiDefined>({ basePath: "/api" });
