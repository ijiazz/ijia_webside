import { HoFetch } from "@/deps/hofetch.ts";
import { ApiDefined } from "@/api.ts";
export const http = new HoFetch({ bodyParser: {} });

export const api = http.createFetchSuite<ApiDefined>({ basePath: "/api" });
