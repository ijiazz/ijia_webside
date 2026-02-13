import { css, cx } from "@emotion/css";
import React, { ReactNode, useState } from "react";

export type CommentTreeProps<T extends CommentNode = CommentNode> = {
  avatarRender?: (data: T) => React.ReactNode;
  headerRender?: (data: T) => React.ReactNode;
  contentRender?: (data: T, children: React.ReactNode) => React.ReactNode;
  data?: Map<string | number, T>;
  testLevel?: number; // 用于测试，
  className?: string;
  style?: React.CSSProperties;
};
export function CommentTree<T extends CommentNode>(props: CommentTreeProps<T>) {
  const { data, avatarRender, headerRender, contentRender, testLevel = 0, className, ...reset } = props;

  if (!data || data.size === 0) {
    return null;
  }

  return (
    <div {...reset} className={cx(CommentTreeCSS, `post-comment-level-${testLevel}`, className)}>
      {renderMap(data, (item, key) => {
        return (
          <div key={key}>
            {avatarRender?.(item)}
            {headerRender?.(item)}
            <div></div>
            {contentRender?.(
              item,
              <CommentTree
                {...props}
                testLevel={testLevel + 1}
                data={item.children as Map<string | number, T> | undefined}
              />,
            )}
          </div>
        );
      })}
    </div>
  );
}
function renderMap<T>(items: Map<string | number, T>, render: (item: T, key: string | number) => ReactNode) {
  const list: ReactNode[] = new Array(items.size);

  let i = 0;
  for (const [key, item] of items) {
    list[i++] = render(item, key);
  }
  return list;
}
const CommentTreeCSS = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  > div {
    display: grid;
    grid-template-columns: max-content auto;
    align-items: center;
    gap: 0px 8px;
  }
`;

export type CommentNode = {
  key: string | number; // 唯一标识符

  parent?: CommentNode | null; // 父评论
  children?: Map<string | number, CommentNode>; // 子评论
};

export function useCommentData<T extends CommentNode>() {
  const [commentData, setCommentData] = useState<Map<string | number, T>>(new Map());
  const forceRender = () => setCommentData((prev) => new Map(prev));

  const deleteItem = (node: T) => {
    const parent = node.parent;
    if (parent) {
      const success = parent.children?.delete(node.key);
      if (!success) console.error(`删除失败，找不到 id 为 ${node.key} 的评论`);
      node.parent = null; // 清除父节点引用
      forceRender(); // 强制更新
    } else {
      setCommentData((prev) => {
        const map = new Map(prev);
        const success = map.delete(node.key);
        if (!success) console.error(`删除失败，找不到 id 为 ${node.key} 的根评论`);
        return map;
      });
    }
  };
  const addItem = (node: T, parent?: T | null) => {
    if (parent) {
      if (!parent.children) {
        parent.children = new Map<string | number, T>();
      }
      parent.children.set(node.key, node);
      forceRender();
    } else {
      setCommentData((prev) => {
        const map = new Map(prev);
        map.set(node.key, node);
        return map;
      });
    }
  };

  const pushList = (list: T[], parent?: T | null) => {
    setCommentData((prev) => {
      if (parent) {
        parent.children = mergeList(parent.children || new Map(), list);
        return new Map(prev);
      } else {
        return mergeList(prev, list);
      }
    });
  };
  const reset = () => setCommentData(new Map());

  const replaceItem = (find: T, merge?: (old: T, find: T) => T) => {
    setCommentData((prev) => {
      const parent = find.parent;
      let list: Map<string | number, CommentNode>;
      if (parent) {
        if (!parent.children) {
          parent.children = new Map<string | number, T>();
        }
        list = parent.children;
      } else {
        list = prev;
      }
      if (merge) {
        const old = list.get(find.key) as T | null;
        if (!old) return prev;
        const newNode = merge(old, find);
        list.set(newNode.key, newNode);
      } else {
        list.set(find.key, find);
      }

      return new Map(prev);
    });
  };
  return {
    commentData,
    deleteItem,
    addItem,
    pushList,
    reset,
    forceRender,
    replaceItem,
  };
}
export function findNodeRoot<T extends CommentNode>(node: T): T {
  while (node.parent) {
    node = node.parent as T;
  }
  return node;
}
function mergeList<T extends { key: string | number }>(list: Map<string | number, T>, pushList: T[]) {
  const map = new Map<string | number, T>(list);

  for (const item of pushList) {
    if (!item.key) console.error("缺少key", item);
    map.set(item.key, item);
  }
  return map;
}
