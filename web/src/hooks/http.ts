import { createContext, useContext } from "react";
import { Api } from "@/common/http.ts";
import { HoFetch } from "@asla/hofetch";

/** @deprecated 已废弃 */
export const ApiContext = createContext<{ api: Api; http: HoFetch; API_PREFIX: string }>(undefined as any);
