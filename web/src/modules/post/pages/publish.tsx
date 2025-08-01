import { CreatePostParam, UpdatePostContentParam, UpdatePostConfigParam } from "@/api.ts";
import { api } from "@/common/http.ts";
import { useAntdStatic } from "@/global-provider.tsx";
import { useAsync } from "@/hooks/async.ts";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Select, Switch, SelectProps, Space } from "antd";
import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { PRadio, RadioOption } from "../components/PostGroupSelect.tsx";

export type UpdatePostParam = Omit<UpdatePostContentParam, "type"> & Omit<UpdatePostConfigParam, "type">;
export function PublishPost(props: {
  editId?: number;
  editType?: "content" | "config";
  initValues?: UpdatePostParam | CreatePostParam;
  onEditOk?: (id: number) => void;
  onCreateOk?: (id: number) => void;
  groupLoading?: boolean;
  groupOptions?: { label: string; value: number; desc?: string }[];
}) {
  const { initValues, onEditOk, onCreateOk, groupOptions, editId, groupLoading, editType } = props;

  const isEdit = editId !== undefined;
  const disableEditContent = isEdit && editType === "config";
  const disableSetting = isEdit && editType === "content";

  const { message } = useAntdStatic();
  const { loading: editLoading, run: commitEdit } = useAsync(async (editId: number, data: UpdatePostParam) => {
    const updateValue: UpdatePostParam = diffUpdateValue(
      {
        content_text: data.content_text,
        content_text_structure: data.content_text_structure ?? null,
        is_hide: data.is_hide,
        comment_disabled: data.comment_disabled,
      },
      initValues as UpdatePostParam | undefined,
    );
    const isChange = Object.keys(updateValue).length;
    if (isChange) {
      switch (editType) {
        case "content":
          await updatePostContent(editId.toString(), {
            content_text: updateValue.content_text,
            content_text_structure: updateValue.content_text_structure,
          });
          break;
        case "config":
          await updatePostConfig(editId.toString(), {
            is_hide: updateValue.is_hide,
            comment_disabled: updateValue.comment_disabled,
          });
          break;
        default:
          throw new Error("未知的编辑类型");
      }

      message.success("已修改");
    }
    onEditOk?.(editId);
  });
  const { run: commitCreate, loading: createLoading } = useAsync(async (data: CreatePostParam) => {
    const { id } = await api["/post/content"].put({ body: data });
    message.success("已发布");
    onCreateOk?.(id);
  });
  const loading = editLoading || createLoading;

  const [form] = Form.useForm<UpdatePostParam | CreatePostParam>();
  const groupId = Form.useWatch("group_id", form);
  return (
    <div>
      <Form
        form={form}
        onFinish={(data) => {
          if (isEdit) {
            commitEdit(editId!, data as UpdatePostParam);
          } else {
            commitCreate(data as CreatePostParam);
          }
        }}
        wrapperCol={{ span: 18 }}
        labelCol={{ span: 4 }}
        initialValues={initValues || {}}
      >
        <Form.Item
          hidden={disableEditContent}
          label="发布内容"
          name="content_text"
          rules={[{ required: true, message: "请输入内容" }]}
        >
          <Input.TextArea placeholder="请输入内容" autoSize={{ minRows: 4, maxRows: 10 }} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item hidden={isEdit} label="内容分类" name="group_id">
          <GroupSelect disabled={isEdit} options={groupOptions} loading={groupLoading} allowClear></GroupSelect>
        </Form.Item>
        <Form.Item hidden={disableSetting} label="仅自己可见" name="is_hide">
          <Switch></Switch>
        </Form.Item>
        <Form.Item hidden={disableSetting} label="关闭评论区" name="comment_disabled">
          <Switch></Switch>
        </Form.Item>
        <Form.Item hidden={isEdit} label="匿名发布" name="is_anonymous">
          <Switch></Switch>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? "确认" : "发布"}
            </Button>
            {!isEdit && groupId !== undefined && <Alert message="已选择分类，发布后将在审核通过公开" />}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
async function updatePostContent(postId: string, content: Omit<UpdatePostContentParam, "type">) {
  await api["/post/content/:postId"].patch({
    params: { postId },
    body: { ...content, type: "content" },
  });
}
async function updatePostConfig(postId: string, config: Omit<UpdatePostConfigParam, "type">) {
  await api["/post/content/:postId"].patch({
    params: { postId },
    body: { ...config, type: "config" },
  });
}

function GroupSelect(props: SelectProps) {
  const { options, value } = props;
  const pruneOption = useMemo(() => {
    let op: SelectProps["options"];
    if (!options || options.length <= 4) op = options;
    else op = options.slice(0, 4);

    return op?.map((item): RadioOption => ({ label: item.label, value: item.value! }));
  }, [options]);

  const tip = useMemo(() => {
    return options?.find((item) => item.value === value)?.desc || "";
  }, [options, value]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options?.length && options.length <= 4 ? (
        <PRadio value={props.value} options={pruneOption} onChange={props.onChange} />
      ) : (
        <Select {...props}></Select>
      )}
      {props.value !== undefined && <Alert message={tip} type="warning" />}
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
    if (news.comment_disabled !== old.comment_disabled) updateValue.comment_disabled = news.comment_disabled;
    if (news.content_text_structure !== old.content_text_structure)
      updateValue.content_text_structure = news.content_text_structure;

    return updateValue;
  }
}

export function PublishPostPage() {
  const navigate = useNavigate();
  const onBack = () => {
    navigate("..");
  };

  const { loading, data: option } = useAsync(
    async () => {
      const { items } = await api["/post/group/list"].get();

      return items.map((item) => ({ label: item.group_name, value: item.group_id, desc: item.rule_desc }));
    },
    { autoRunArgs: [] },
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回
        </Button>
      </div>
      <div style={{ padding: "12px", flex: 1, overflow: "auto" }}>
        <PublishPost
          onCreateOk={() => {
            navigate("/wall/list/self");
          }}
          groupOptions={option}
          groupLoading={loading}
        />
      </div>
    </div>
  );
}
