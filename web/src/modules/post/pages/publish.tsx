import { CreatePostParam, UpdatePostParam } from "@/api.ts";
import { api } from "@/common/http.ts";
import { useAntdStatic } from "@/hooks/antd.ts";
import { useAsync } from "@/hooks/async.ts";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, Switch } from "antd";
import React from "react";
import { useNavigate } from "react-router";

export function PublishPost(props: {
  editId?: number;
  disableEditContent?: boolean;
  disableSetting?: boolean;
  initValues?: UpdatePostParam;
  onEditOk?: (id: number) => void;
  onCreateOk?: (id: number) => void;
  groupLoading?: boolean;
  groupOptions?: { label: string; value: number }[];
}) {
  const { initValues, onEditOk, onCreateOk, groupOptions, editId, groupLoading, disableEditContent, disableSetting } =
    props;
  const { message } = useAntdStatic();
  const isEdit = editId !== undefined;
  const { run, reset, loading } = useAsync(async (data: CreatePostParam) => {
    if (isEdit) {
      const updateValue: UpdatePostParam = diffUpdateValue(
        {
          content_text: data.content_text,
          content_text_structure: data.content_text_structure ?? null,
          is_hide: data.is_hide,
        },
        initValues,
      );
      const isChange = Object.keys(updateValue).length;
      if (isChange) {
        if (disableEditContent) {
          delete updateValue.content_text;
          delete updateValue.content_text_structure;
        }
        if (disableSetting) {
          delete updateValue.is_hide;
        }

        await api["/post/content/:postId"].patch({ params: { postId: editId }, body: updateValue });
        message.success("已修改");
      }
      onEditOk?.(editId);
    } else {
      const { id } = await api["/post/content"].put({ body: data });
      message.success("已发布");
      onCreateOk?.(id);
    }
  });

  return (
    <div>
      <Form onFinish={run} wrapperCol={{ span: 18 }} labelCol={{ span: 4 }} initialValues={initValues || {}}>
        <Form.Item hidden={isEdit} label="内容分类" name="group_id">
          <Select disabled={isEdit} options={groupOptions} loading={groupLoading} allowClear></Select>
        </Form.Item>
        <Form.Item
          hidden={disableEditContent}
          label="发布内容"
          name="content_text"
          rules={[{ required: true, message: "请输入内容" }]}
        >
          <Input.TextArea placeholder="请输入内容" autoSize={{ minRows: 4, maxRows: 10 }} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item hidden={disableSetting} label="仅自己可见" name="is_hide">
          <Switch></Switch>
        </Form.Item>
        <Form.Item hidden={isEdit} label="匿名发布" name="is_anonymous">
          <Switch></Switch>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEdit ? "确认" : "发布"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

function diffUpdateValue(news: UpdatePostParam, old?: UpdatePostParam): UpdatePostParam {
  if (!old) {
    return news;
  } else {
    let updateValue: UpdatePostParam = {};
    if (news.content_text !== old.content_text) updateValue.content_text = news.content_text;
    if (news.is_hide !== old.is_hide) updateValue.is_hide = news.is_hide;
    if (news.content_text_structure !== old.content_text_structure)
      updateValue.content_text_structure = news.content_text_structure;

    return updateValue;
  }
}

export function PublishPostPage() {
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };
  return (
    <div>
      <div>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回
        </Button>
      </div>
      <div style={{ padding: "12px" }}>
        <PublishPost />
      </div>
    </div>
  );
}
