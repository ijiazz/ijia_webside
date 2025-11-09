import { insertIntoValues } from "@/sql/utils.ts";
import { DbPlaAssetCreate, pla_asset, Platform } from "@ijia/data/db";
import { dbPool } from "@ijia/data/dbclient";

export async function insertPosts(size: number, platform: Platform, pla_uid: string) {
  const posts: DbPlaAssetCreate[] = new Array(size);
  let date = new Date("2025-01-01").getTime();
  for (let i = 0; i < size; i++) {
    posts[i] = {
      platform,
      pla_uid,
      asset_id: `post-${platform}-${pla_uid}-${i}`,
      content_text: `post-${platform}-${pla_uid}-${i}`,
      publish_time: new Date(date + i * 1000 * 60 * 60),
    };
  }
  await insertIntoValues(pla_asset.name, posts).client(dbPool);
}
