import { PostGroupItem } from "@/api.ts";
import React from "react";

export type PostQueryFilter = {
  group?: PostGroupItem;
  self?: boolean;
};
export const PostQueryFilterContext = React.createContext<PostQueryFilter>({});
