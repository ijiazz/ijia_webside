import { GetPostListParam, PostItemDto } from "@/api.ts";
import { useAntdStatic } from "@/global-provider.tsx";
import { useRef, useState } from "react";
import { api } from "@/common/http.ts";
import { dateToString } from "@/common/date.ts";
import { PostQueryFilter } from "./PostQueryFilterContext.tsx";

export function useItemData(option: { filter?: PostQueryFilter } = {}) {
  const { filter = {} } = option;
  const [items, setItems] = useState<PostItemDto[]>([]);
  const reloadingRef = useRef<Record<number, Promise<any>>>({});
  const loadOldMore = (cursor?: string) => {
    return getPostList({ cursor, group_id: filter.group?.group_id, self: filter.self });
  };
  const loadNewest = async (id?: number) => {
    if (typeof id === "number") {
      // 创建
      const { items } = await getPostList({ post_id: id, group_id: filter.group?.group_id, self: filter.self });
      if (items.length > 0) {
        setItems((prev) => {
          const newItem = items[0];
          return [newItem, ...prev];
        });
      }
    } else {
      //TODO 获取最新
    }
  };
  const reloadItem = (id: number) => {
    const reloadIng = reloadingRef.current;
    const promise = getPostList({ post_id: id, group_id: filter.group?.group_id, self: filter.self })
      .then((res) => {
        if (reloadIng[id] === undefined) return; // 已被后调用来的更新

        const item = res.items[0];
        if (!item) return;

        setItems((prev) => {
          return prev.map((i) => (i.post_id === item.post_id ? item : i));
        });
      })
      .finally(() => {
        if (reloadIng[id] === promise) delete reloadIng[id];
      });
    reloadIng[id] = promise;
    return promise;
  };
  const deleteItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.post_id !== id));
  };
  const replaceItem = (postId: number, replaceFn: (old: PostItemDto) => PostItemDto) => {
    setItems((prev) => {
      return prev.map((item) => {
        if (item.post_id === postId) {
          return replaceFn(item);
        }
        return item;
      });
    });
  };

  const { message } = useAntdStatic();
  const onPostLike = (id: number, isCancel: boolean) => {
    replaceItem(id, (old) => {
      const c = old.curr_user;
      if (c) {
        c.is_like = !isCancel;
        if (isCancel) old.stat.like_total--;
        else old.stat.like_total++;
      }
      return old;
    });
    const reloading = reloadingRef.current;
    const promise = api["/post/like/:postId"].post({ params: { postId: id }, query: { isCancel } });
    if (!reloading[id]) {
      reloading[id] = promise;
    }

    promise
      .then(
        (res) => res.success,
        (error) => {
          console.error(error);
          message.error(isCancel ? "取消点赞失败" : "点赞失败");
          return false;
        },
      )
      .then((success: boolean) => {
        if (reloading[id] === promise) {
          //这个过程这个帖子没有被请求刷新过
          delete reloading[id];
          if (!success) {
            replaceItem(id, (old) => {
              const c = old.curr_user;
              if (c) {
                c.is_like = !c.is_like;
                if (isCancel) old.stat.like_total++;
                else old.stat.like_total--;
              }
              return old;
            });
          }
        } else {
          return reloadItem(id);
        }
      });
  };
  return { items, setItems, loadOldMore, loadNewest, reloadItem, deleteItem, replaceItem, onPostLike };
}
async function getPostList(param?: GetPostListParam) {
  return api["/post/list"].get({ query: param }).then((res) => {
    for (const item of res.items) {
      if (item.publish_time) {
        item.publish_time = dateToString(item.publish_time, "minute");
      }
      if (item.update_time) {
        item.update_time = dateToString(item.update_time, "minute");
      }
    }

    return {
      items: res.items,
      hasMore: res.has_more,
      nextParam: res.next_cursor || undefined,
    };
  });
}
