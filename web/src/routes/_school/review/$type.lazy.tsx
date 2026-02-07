import { createLazyFileRoute } from "@tanstack/react-router";

import { api } from "@/common/http.ts";
import { CommitReviewParam } from "@/api.ts";
import { Button, Empty, Input, Radio, Typography } from "antd";
import { useAntdStatic } from "@/provider/mod.tsx";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { getReviewNextQueryOption } from "@/request/review.ts";
import { FormErrorMessage, getAntdErrorStatus } from "@/components/FormItem.tsx";
import { ReviewItem } from "./-components/ReviewItem.tsx";
import type { RouteParam } from "./$type.tsx";

export const Route = createLazyFileRoute("/_school/review/$type")({
  component: RouteComponent,
});

type FormValues = {
  remark?: string;
  isPass: boolean;
};
function RouteComponent() {
  const { message } = useAntdStatic();
  const { type: reviewType } = Route.useParams() as RouteParam;
  const form = useForm<FormValues>();
  const { isSubmitting } = form.formState;
  const {
    data: initData,
    isFetching,
    refetch,
  } = useSuspenseQuery({
    ...getReviewNextQueryOption({ type: reviewType }),
    refetchOnMount: false,
  });

  const { data, mutateAsync } = useMutation({
    async mutationFn(param: CommitReviewParam) {
      return api["/review/commit/:type"].post({ params: { type: reviewType }, body: param });
    },
    onSuccess(data) {
      if (data.success) message.success("审核成功");
      else message.info("操作已被被忽略");
    },
  });
  const reviewData = data ? data.next : initData.item;

  const isPass = form.watch("isPass");

  if (!reviewData) {
    return (
      <Empty
        description={
          <div>
            没有待审核的内容
            <Button type="link" onClick={() => refetch()} loading={isFetching}>
              刷新
            </Button>
          </div>
        }
      />
    );
  }
  return (
    <div
      style={{
        margin: "auto",
        maxWidth: 460,
        height: "100%",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <Typography.Title style={{ margin: 0 }} level={4}>
        内容审核
      </Typography.Title>
      <div style={{ flex: 1, overflow: "auto" }}>
        <ReviewItem item={reviewData} />
      </div>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            return mutateAsync({ review_id: reviewData.id, is_passed: values.isPass, remark: values.remark });
          })}
        >
          <Controller
            name="remark"
            rules={{
              required: "请填写原因",
            }}
            render={({ field, fieldState }) => {
              return (
                <>
                  <Input.TextArea
                    {...field}
                    placeholder="填写原因将反馈给帖子作者"
                    status={getAntdErrorStatus(fieldState)}
                  />
                  <FormErrorMessage message={fieldState.error?.message} />
                </>
              );
            }}
          />
          <div style={{ display: "flex", justifyContent: "end" }}>
            <Controller
              name="isPass"
              rules={{ required: "请选择" }}
              render={({ field, fieldState }) => {
                return (
                  <>
                    <Radio.Group {...field} buttonStyle="solid">
                      <Radio.Button value={true}>通过</Radio.Button>
                      <Radio.Button value={false}>不通过</Radio.Button>
                    </Radio.Group>
                    <FormErrorMessage message={fieldState.error?.message} />
                  </>
                );
              }}
            />
            <Button
              style={{ marginLeft: "24px" }}
              disabled={isPass === undefined}
              loading={isSubmitting}
              color={isPass ? "green" : "danger"}
              variant="solid"
              htmlType="submit"
            >
              确定
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
