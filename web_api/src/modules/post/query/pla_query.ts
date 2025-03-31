import { DbUserAvatarCreate, pla_asset, pla_comment, pla_user, user_avatar } from "@ijia/data/db";
import { DbQuery, v } from "@ijia/data/yoursql";
import type {
  CommentReplyItemDto,
  CommentRootItemDto,
  GetCommentListParam,
  GetCommentReplyListParam,
  GetUserParam,
  UserItemDto,
} from "./query.dto.ts";
import { createSearch } from "@/global/sql_util.ts";
const operation = {
  andEq(value: Record<string, any>): string[] {
    let values: string[] = [];
    const keys = Object.keys(value);
    let val: any;
    for (let i = 0; i < keys.length; i++) {
      val = value[keys[i]];
      if (val === undefined) continue;
      if (val === null) values.push(keys[i] + " IS NULL");
      else values.push(keys[i] + "=" + v(val));
    }
    return values;
  },
};

function uriToUrl(uri: string, origin: string) {
  return origin + "/file/" + uri;
}

export function renameAvatarUriSql(oldId: string, newImage: DbUserAvatarCreate) {
  const newId = newImage.id;
  if (oldId === newId) throw new Error("oldUri 不能和 newId 一致");
  let sql = user_avatar.insert([newImage]).onConflict(["id"]).doNotThing().toString();
  sql += ";\n" + pla_user.updateFrom({ avatar: newId }).where("avatar=" + v(oldId));
  sql += ";\n" + pla_asset.updateFrom({ user_avatar_snapshot: newId }).where("user_avatar_snapshot=" + v(oldId));
  sql += ";\n" + pla_comment.updateFrom({ user_avatar_snapshot: newId }).where("user_avatar_snapshot=" + v(oldId));
  return sql;
}

export async function getUserList(queryable: DbQuery, option: GetUserParam & DebugOption = {}): Promise<UserItemDto[]> {
  const { page = 0, pageSize = 20, platform, user_id, s_user_name } = option;

  const sql = pla_user
    .fromAs("p")
    .select<UserItemDto>({
      avatarUrl: "p.avatar",
      ip_location: true,
      user_name: true,
      user_id: "p.pla_uid",
    })
    .where(() => {
      const searchWhere = [];
      if (s_user_name) searchWhere.push(createSearch("user_name", s_user_name));
      return operation.andEq({ platform, pla_uid: user_id }).concat(searchWhere);
    })
    .limit(pageSize, page * pageSize);
  option.catchSql?.(sql.toString());
  return queryable.queryRows(sql);
}

interface DebugOption {
  catchSql?(sql: string): void;
}

function sqlCommentList(option: (GetCommentListParam & GetCommentReplyListParam) & DebugOption = {}) {
  const { page = 0, pageSize = 20, root_comment_id = null, sort } = option;

  const selectable = pla_comment
    .fromAs("c")
    .innerJoin(pla_user, "u", "u.pla_uid=c.pla_uid")
    .select({
      comment_id: "c.comment_id",
      content_text: "c.content_text",
      comment_type: "c.comment_type",
      publish_time: "c.publish_time",
      like_count: "c.like_count",
      author_like: "c.author_like",
      image_uri: "c.image_uri",
      user: `jsonb_build_object('user_name', u.user_name, 'user_id', u.pla_uid)`,
    })
    .where(() => {
      const where: string[] = operation.andEq({
        asset_id: option.asset_id,
        root_comment_id: root_comment_id,
      });
      if (option.s_content) where.push(createSearch("c.content_text", option.s_content));
      if (option.s_user) where.push(createSearch("u.user_name", option.s_user));
      return where;
    })
    .orderBy(() => {
      let by: string[] = [];
      if (sort) {
        const map: Record<string, string> = {
          author_like: "c.author_like",
          publish_time: "c.published_time",
          like_count: "c.like_count",
        };
        for (const [k, v] of Object.entries(sort)) {
          if (!map[k]) continue;
          by.push(map[k] + " " + v);
        }
      }
      return by;
    })
    .limit(pageSize, page * pageSize);

  return selectable;
}
export async function getCommentList(
  queryable: DbQuery,
  option: GetCommentListParam & DebugOption = {},
): Promise<CommentRootItemDto[]> {
  const sql0 = sqlCommentList(option);

  const sql = `WITH t AS ${sql0.toSelect()}
SELECT  c_t.count AS reply_total, t.* FROM t 
LEFT JOIN (
SELECT c.root_comment_id,count(*)::INT FROM t inner JOIN pla_comment AS c ON c.root_comment_id=t.comment_id 
GROUP BY c.root_comment_id) AS c_t
ON t.comment_id=c_t.root_comment_id ;`;

  option.catchSql?.(sql.toString());
  const rows = await queryable.queryRows<CommentReplyItemDto>(sql);

  return rows.map((item): CommentReplyItemDto => {
    item.imageUrlList = Reflect.get(item, "image_uri")?.map(uriToUrl);
    Reflect.deleteProperty(item, "image_uri");
    return item;
  });
}
export async function getCommentReplyByCid(
  queryable: DbQuery,
  option: GetCommentReplyListParam & DebugOption = {},
): Promise<CommentReplyItemDto[]> {
  const sql = sqlCommentList(option);

  option.catchSql?.(sql.toString());
  const rows = await queryable.queryRows<CommentReplyItemDto>(sql);

  return rows.map((item): CommentReplyItemDto => {
    item.imageUrlList = Reflect.get(item, "image_uri")?.map(uriToUrl);
    Reflect.deleteProperty(item, "image_uri");
    return item;
  });
}
