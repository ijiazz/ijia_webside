import { PostGroupItem } from "@/api.ts";
import React from "react";

export type PostQueryFilter = {
  group?: PostGroupItem;
};
export const PostQueryFilterContext = React.createContext<PostQueryFilter>({});
