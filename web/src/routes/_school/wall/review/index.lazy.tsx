import { createLazyFileRoute } from "@tanstack/react-router";

import React, { useState } from "react";
import { useAsync } from "@/hooks/async.ts";
import { api } from "@/common/http.ts";
import {
  CommitReviewParam,
  PostReviewDto,
  PostReviewType,
  PostReviewTarget,
  PostCommentReviewTarget,
  PostReviewItemDto,
} from "@/api.ts";
import { Button, Empty, Form, Input, Radio, Typography } from "antd";
import { useAntdStatic } from "@/global-provider.tsx";
import { PostCommentReviewCard, PostReviewCard } from "./-components/PostReviewCard.tsx";

export const Route = createLazyFileRoute("/_school/wall/review/")({
  component: RouteComponent,
});

type FormValues = {
  remark?: string;
  isPass: boolean;
};
function RouteComponent() {
  const data: PostReviewItemDto | undefined = Route.useLoaderData();
  const [form] = Form.useForm<FormValues>();
  const { message } = useAntdStatic();

  const { loading, run } = useAsync(async (reviewId?: string, param?: CommitReviewParam) => {
    if (reviewId === undefined || param === undefined) {
      const res = await api["/post/review/next"].get();
      setReviewData(res.next);
    } else {
      const res = await api["/post/review/entity/:reviewId/commit"].post({ body: param, params: { reviewId } });
      setReviewData(res.next);
      if (res.success) message.success("审核成功");
      else message.info("操作已被被忽略");
    }
    form.resetFields();
  });
  const [reviewData, setReviewData] = useState<PostReviewDto | undefined>(data?.next);

  const isPass = Form.useWatch("isPass", form);

  if (!reviewData) {
    return (
      <Empty
        description={
          <div>
            没有待审核的内容
            <Button type="link" onClick={() => run()} loading={loading}>
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
        {reviewData.review_type === PostReviewType.post && (
          <PostReviewCard item={reviewData.target as PostReviewTarget} />
        )}
        {reviewData.review_type === PostReviewType.postComment && (
          <PostCommentReviewCard item={reviewData.target as PostCommentReviewTarget} />
        )}
      </div>
      <Form
        form={form}
        onFinish={(values) => {
          run(reviewData.review_id, { isPass: values.isPass, remark: values.remark });
        }}
      >
        <Form.Item required rules={[{ required: !isPass }]} hidden={isPass !== false} name="remark" label="违规原因">
          <Input.TextArea placeholder="填写原因将反馈给帖子作者" />
        </Form.Item>
        <div style={{ display: "flex", justifyContent: "end" }}>
          <Form.Item name="isPass" required rules={[{ required: true }]}>
            <Radio.Group buttonStyle="solid">
              <Radio.Button value={true}>通过</Radio.Button>
              <Radio.Button value={false}>不通过</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Button
            style={{ marginLeft: "24px" }}
            disabled={isPass === undefined}
            loading={loading}
            color={isPass ? "green" : "danger"}
            variant="solid"
            htmlType="submit"
          >
            确定
          </Button>
        </div>
      </Form>
    </div>
  );
}
