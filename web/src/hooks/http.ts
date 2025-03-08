import { createContext, useContext } from "react";
import { Api } from "@/common/http.ts";
import { HoFetch } from "@asla/hofetch";

export const ApiContext = createContext<{ api: Api; http: HoFetch; API_PREFIX: string }>(undefined as any);

export function useHoFetch() {
  return useContext(ApiContext);
}
export const IGNORE_ERROR_MSG = Symbol("ignore error message");
