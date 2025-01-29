import { HoFetch } from "@/deps/hofetch.ts";

export const http = new HoFetch({ bodyParser: {} });
export const api = {
  abc: http.createFetchSuite<Record<string, any>>(""),
};
