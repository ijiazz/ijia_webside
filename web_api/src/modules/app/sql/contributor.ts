import { ContributorInfo } from "../app.dto.ts";
import { user } from "@ijia/data/db";

export async function getContributors(): Promise<ContributorInfo[]> {
  const { contributeList } = await import("@/contributors.ts");
  const map = new Map<string | number, ContributorInfo>();

  const idList: number[] = [];
  for (const item of contributeList) {
    if (item.id === undefined) {
      let key = item.link ?? item.name + (item.avatar ?? "");
      map.set(key, { ...item, id: key });
    } else {
      map.set(item.id, { ...item, id: item.id, name: "" });
      idList.push(item.id);
    }
  }

  const rows = await user
    .select({ avatar: true, nickname: true })
    .where(`id IN (${idList.join(",")})`)
    .queryRows();

  for (const row of rows) {
    const item = map.get(row.id);
    if (item) {
      item.name = row.nickname;
      item.avatar = row.avatar;
    }
  }
  return Array.from(map.values());
}
