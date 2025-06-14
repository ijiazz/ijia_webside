import { CreatePostParam, UpdatePostParam } from "@/api.ts";
import { api } from "@/common/http.ts";
import { useAntdStatic } from "@/global-provider.tsx";
import { useAsync } from "@/hooks/async.ts";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Select, Switch, SelectProps, Space } from "antd";
import React, { useMemo } from "react";
import { useNavigate } from "react-router";
import { PRadio, RadioOption } from "../components/PostGroupSelect.tsx";

export function PublishPost(props: {
  editId?: number;
  disableEditContent?: boolean;
  disableSetting?: boolean;
  initValues?: UpdatePostParam | CreatePostParam;
  onEditOk?: (id: number) => void;
  onCreateOk?: (id: number) => void;
  groupLoading?: boolean;
  groupOptions?: { label: string; value: number; desc?: string }[];
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
        initValues as UpdatePostParam | undefined,
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
  const [form] = Form.useForm();
  const groupId = Form.useWatch("group_id", form);

  return (
    <div>
      <Form
        form={form}
        onFinish={run}
        wrapperCol={{ span: 18 }}
        labelCol={{ span: 4 }}
        initialValues={initValues || {}}
      >
        <Form.Item hidden={isEdit} label="内容分类" name="group_id">
          <GroupSelect disabled={isEdit} options={groupOptions} loading={groupLoading} allowClear></GroupSelect>
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
