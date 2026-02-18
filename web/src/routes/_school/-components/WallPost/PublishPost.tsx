import { CreatePostParam, UpdatePostContentParam, UpdatePostConfigParam } from "@/api.ts";
import { api } from "@/request/client.ts";
import { useAntdStatic } from "@/provider/mod.tsx";
import { Alert, Button, Input, Switch, Space } from "antd";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { FormItem, getAntdErrorStatus } from "@/components/form.tsx";
import { css } from "@emotion/css";
import { GroupSelect } from "./GroupSelect.tsx";
import { useMutation } from "@tanstack/react-query";

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
  const form = useForm<UpdatePostParam | CreatePostParam>({ defaultValues: initValues });
  const {
    formState: { isDirty, isSubmitting },
  } = form;
  const isEdit = editId !== undefined;
  const disableEditContent = isEdit && editType === "config";
  const disableSetting = isEdit && editType === "content";

  const { message } = useAntdStatic();

  const { mutateAsync: submitUpdateContent } = useMutation({
    mutationFn: async (data: UpdateContentParam & { postId: number }) => {
      const { postId, ...updateValue } = data;
      return updatePostContent(postId, updateValue);
    },
  });
  const { mutateAsync: submitUpdateConfig } = useMutation({
    mutationFn: async (data: UpdateConfigParam & { postId: number }) => {
      const { postId, ...updateValue } = data;
      return updatePostConfig(postId, updateValue);
    },
  });
  const { mutateAsync: submitCreate } = useMutation({
    mutationFn: (data: CreatePostParam) => {
      return api["/post/entity"].put({ body: data });
    },
  });

  const groupId = useWatch({ control: form.control, name: "group_id" });

  return (
    <FormProvider {...form}>
      <form
        style={{ fontSize: 14 }}
        onSubmit={form.handleSubmit(async (data) => {
          if (isEdit) {
            if (editId) {
              if (editType === "config") await submitUpdateConfig({ postId: editId, ...data });
              else if (editType === "content") await submitUpdateContent({ postId: editId, ...data });
            }
            message.success("已修改");
            onEditOk?.(editId);
          } else {
            const { id } = await submitCreate(data as CreatePostParam);
            message.success("已发布");
            onCreateOk?.(id);
          }
        })}
      >
        {disableEditContent || (
          <Controller
            name="content_text"
            disabled={disableEditContent}
            rules={{ required: "请输入内容" }}
            render={({ field, fieldState }) => {
              return (
                <FormItem error={fieldState.error?.message} required={true} label="发布内容">
                  <Input.TextArea
                    {...field}
                    placeholder="请输入内容"
                    autoSize={{ minRows: 4, maxRows: 10 }}
                    style={{ width: "100%" }}
                    status={getAntdErrorStatus(fieldState)}
                  />
                </FormItem>
              );
            }}
          />
        )}
        {isEdit || groupOptions?.length === 0 || (
          <Controller
            name="group_id"
            render={({ field, fieldState }) => {
              return (
                <FormItem error={fieldState.error?.message} label="主题">
                  <GroupSelect
                    {...field}
                    disabled={isEdit}
                    options={groupOptions}
                    loading={groupLoading}
                    allowClear
                    aria-label="主题"
                    status={getAntdErrorStatus(fieldState)}
                  />
                </FormItem>
              );
            }}
          />
        )}
        {disableSetting || (
          <>
            <Controller
              name="is_hide"
              render={({ field, fieldState }) => (
                <FormItem
                  error={fieldState.error?.message}
                  classNames={{ label: SwitchLabelCSS }}
                  label="仅自己可见"
                  layout="horizontal"
                >
                  <Switch {...field} aria-label="仅自己可见" />
                </FormItem>
              )}
            />
            <Controller
              name="comment_disabled"
              render={({ field, fieldState }) => (
                <FormItem
                  error={fieldState.error?.message}
                  classNames={{ label: SwitchLabelCSS }}
                  label="关闭评论区"
                  layout="horizontal"
                >
                  <Switch {...field} aria-label="关闭评论区" />
                </FormItem>
              )}
            />
          </>
        )}
        {isEdit || (
          <Controller
            name="is_anonymous"
            render={({ field, fieldState }) => (
              <FormItem
                error={fieldState.error?.message}
                classNames={{ label: SwitchLabelCSS }}
                label="匿名发布"
                layout="horizontal"
              >
                <Switch {...field} aria-label="匿名发布" />
              </FormItem>
            )}
          />
        )}
        <Space>
          <Button type="primary" htmlType="submit" disabled={isEdit ? !isDirty : undefined} loading={isSubmitting}>
            {isEdit ? "确认" : "发布"}
          </Button>
          {!isEdit && groupId !== undefined && <Alert title="选择主题后，将在审核通过后公开" />}
        </Space>
      </form>
    </FormProvider>
  );
}

const SwitchLabelCSS = css`
  min-width: 75px;
`;

type UpdateContentParam = Omit<UpdatePostContentParam, "type">;

async function updatePostContent(postId: number | string, content: UpdateContentParam) {
  await api["/post/entity/:postId"].patch({
    params: { postId },
    body: { ...content, type: "content" },
  });
}
type UpdateConfigParam = Omit<UpdatePostConfigParam, "type">;
async function updatePostConfig(postId: number | string, config: UpdateConfigParam) {
  await api["/post/entity/:postId"].patch({
    params: { postId },
    body: { ...config, type: "config" },
  });
}
