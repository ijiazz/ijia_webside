import { PublicPost, SelfPost } from "@ijia/api-types";
import { WallPostCard } from "./PostCard.tsx";
import { ReportModal } from "../ReportModal.tsx";
import { useState, Dispatch, useRef, useImperativeHandle } from "react";
import { DeleteOutlined, EditOutlined, SettingOutlined, WarningOutlined } from "@ant-design/icons";
import { MenuProps } from "antd";
import { api } from "@/request/client.ts";
import { useAntdStatic } from "@/provider/mod.tsx";
import styled from "@emotion/styled";

export type PostListHandle = {
  reloadItem: (id: number) => Promise<void>;
};
export type PostListProps<T extends PublicPost> = Pick<React.HTMLAttributes<HTMLDivElement>, "className" | "style"> & {
  data: T[];
  setData: Dispatch<React.SetStateAction<T[]>>;
  loadItem: (id: number) => Promise<T>;
  onOpenComment?: (postId: number) => void;
  onSetting?: (item: T) => void;
  onEdit?: (item: T) => void;
  canEdit?: boolean;

  ref?: React.Ref<PostListHandle>;
};

export function PostList<T extends PublicPost>(props: PostListProps<T>) {
  const { data, setData, loadItem, onOpenComment, onSetting, onEdit, canEdit, ref, ...rest } = props;
  const { modal, message } = useAntdStatic();
  const reloadingRef = useRef<Record<number, Promise<any>>>({});

  const [reportOpen, setReportOpen] = useState<T | undefined>();
  const reloadItem = (id: number) => {
    const promise = loadItem(id)
      .then((item) => {
        setData((prev) => {
          return prev.map((i) => (i.post_id === item.post_id ? item : i));
        });
      })
      .finally(() => {
        const reloadIng = reloadingRef.current;
        if (reloadIng[id] === promise) delete reloadIng[id];
      });
    reloadingRef.current[id] = promise;
    return promise;
  };
  const onDeletePost = (item: T) => {
    modal.confirm({
      title: "删除确认",
      onOk: () => {
        return api["/post/entity/:postId"].delete({ params: { postId: item.post_id } }).then(() => {
          setData((prev) => prev.filter((i) => i.post_id !== item.post_id));
          message.success("删除成功");
        });
      },
    });
  };
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
    const promise = api["/post/entity/:postId/like"].post({ params: { postId: id }, query: { isCancel } }).then(
      () => {
        if (reloading[id] === promise) delete reloading[id];
      },
      () => {
        message.error(isCancel ? "取消点赞失败" : "点赞失败");
        reloadItem(id);
      },
    );

    if (!reloading[id]) {
      reloading[id] = promise;
    }
  };

  const replaceItem = (id: number, replacer: (item: T) => T) => {
    setData((prev) => {
      return prev.map((i) => {
        if (i.post_id === id) {
          return replacer(i);
        }
        return i;
      });
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      reloadItem,
    }),
    [],
  );
  return (
    <div {...rest}>
      {data.map((item, index) => {
        const moreMenus: MenuProps["items"] = [];
        if (item.curr_user) {
          moreMenus.push({
            icon: <WarningOutlined />,
            label: item.curr_user.is_report ? "已举报" : "举报",
            key: "report",
            disabled: item.curr_user.is_report,
            onClick: () => setReportOpen(item),
          });
        }
        if (canEdit) {
          moreMenus.unshift(
            { icon: <EditOutlined />, label: "编辑", key: "edit", onClick: () => onEdit?.(item) },
            {
              icon: <SettingOutlined />,
              label: "设置",
              key: "setting",
              onClick: () => onSetting?.(item),
            },
            { icon: <DeleteOutlined />, label: "删除", key: "delete", onClick: () => onDeletePost(item) },
          );
        }
        return (
          <PostListCSS key={item.post_id} style={{ borderRadius: 8 }} className="e2e-post-item">
            <WallPostCard
              item={item}
              config={(item as any as SelfPost).config}
              review={(item as any as SelfPost).review}
              moreMenus={moreMenus}
              onLike={onPostLike}
              onOpenComment={onOpenComment}
            />
          </PostListCSS>
        );
      })}
      <ReportModal
        open={!!reportOpen}
        onClose={() => setReportOpen(undefined)}
        onSubmit={async (reason) => {
          if (!reportOpen) return;
          const { success } = await api["/post/entity/:postId/report"].post({
            body: { reason },
            params: { postId: reportOpen.post_id },
          });
          message.success("举报成功");
          setReportOpen(undefined);
          if (success) {
            replaceItem(reportOpen.post_id, (old) => {
              if (!old.curr_user) return old;
              old.curr_user.is_report = true;
              return old;
            });
          }
        }}
      />
    </div>
  );
}
const PostListCSS = styled.div`
  margin-bottom: 12px;
  border-radius: 8px;
`;
