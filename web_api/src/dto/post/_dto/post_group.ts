import { ListDto } from "../../common.ts";

export type PostGroupItem = {
  group_id: number;
  group_name: string;
  group_desc?: string;
  rule_desc?: string;
};
export type PostGroupResponse = ListDto<PostGroupItem>;
export type PostGroupInfo = {
  group_id: string;
  group_name: string;
};
