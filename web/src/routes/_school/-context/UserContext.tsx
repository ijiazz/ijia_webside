import { User } from "@/api.ts";
import React from "react";

export const BasicUserContext = React.createContext<User | null>(null);
