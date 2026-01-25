import { UserBasicDto } from "@/api.ts";
import React from "react";

export const BasicUserContext = React.createContext<UserBasicDto | null>(null);
