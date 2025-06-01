import { CreatePostParam, UpdatePostParam } from "@/api.ts";
import { useAntdStatic } from "@/hooks/antd.ts";
import { useAsync } from "@/hooks/async.ts";
import { useHoFetch } from "@/hooks/http.ts";
import { Button, Form, Input, Select, Switch } from "antd";
import React from "react";

export function PublishPost(props: {
  initValues?: UpdatePostParam;
  onOk?: () => void;
  defaultGroup?: { groupName: string; groupId: number };
  groupLoading?: boolean;
  groupOptions?: { label: string; value: number }[];
}) {
  const { initValues, onOk, groupOptions, defaultGroup, groupLoading } = props;
  const { api } = useHoFetch();
  const { message } = useAntdStatic();
  const { run, reset, result } = useAsync(async (data: CreatePostParam) => {
    if (isEdit) {
      //TODO diff
      await api["/post/content/:postId"].patch({ body: {} });
      message.success("已修改");
    } else {
      await api["/post/content"].put({ body: data });
      message.success("已发布");
    }
    onOk?.();
  });
  const isEdit = !!initValues;

  return (
    <div>
      <Form onFinish={run}>
        <Form.Item label="内容分类" name="group_id">
          <Select disabled={isEdit} options={groupOptions} loading={groupLoading}></Select>
        </Form.Item>
        <Form.Item label="发布内容" name="content_text">
          <Input.TextArea placeholder="请输入内容" autoSize={{ minRows: 4, maxRows: 10 }} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="仅自己可见" name="is_hide">
          <Switch></Switch>
        </Form.Item>
        <Form.Item hidden={isEdit} label="匿名发布" name="is_anonymous">
          <Switch></Switch>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={result.loading}>
            发布
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export function PublishPostPage() {
  return <PublishPost />;
}
