import { createLazyFileRoute } from "@tanstack/react-router";

import { api } from "@/request/client.ts";
import { CommitReviewParam, ExamQuestionType, GetQuestionReviewNextResult, QuestionCommitReviewParam } from "@/api.ts";
import { Alert, Button, Card, Checkbox, Empty, Input, Radio, Space, Tag, Typography } from "antd";
import { useAntdStatic } from "@/provider/mod.tsx";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { getReviewNextQueryOption } from "@/request/review.ts";
import { getQuestionReviewNextQueryOption, QUESTION_REVIEW_ROUTE_TYPE } from "@/request/question.ts";
import { FormErrorMessage, getAntdErrorStatus } from "@/components/form.tsx";
import { ReviewItem } from "../-components/ReviewItem.tsx";
import type { RouteParam } from "./index.tsx";
import { useEffect } from "react";

export const Route = createLazyFileRoute("/_school/review/$type/")({
  component: RouteComponent,
});

type FormValues = {
  remark?: string;
  isPass: boolean;
};
function RouteComponent() {
  const { type: reviewType } = Route.useParams() as RouteParam;

  if (reviewType === QUESTION_REVIEW_ROUTE_TYPE) {
    return <QuestionReviewRoute />;
  }

  return <CommonReviewRoute reviewType={reviewType} />;
}

function CommonReviewRoute({ reviewType }: { reviewType: Exclude<RouteParam["type"], typeof QUESTION_REVIEW_ROUTE_TYPE> }) {
  const { message } = useAntdStatic();
  const form = useForm<FormValues>();
  const { isSubmitting } = form.formState;
  const { data: initData, isFetching, refetch } = useSuspenseQuery(getReviewNextQueryOption({ type: reviewType }));

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
              required: isPass ? undefined : "请填写原因",
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
              rules={{ validate: (value) => (typeof value === "boolean" ? undefined : "请选择") }}
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

type QuestionFormValues = {
  question_text: string;
  question_type: ExamQuestionType;
  options: { value: string }[];
  answer_index: number[];
  explanation_text: string;
  remark?: string;
  isPass: boolean;
};

function QuestionReviewRoute() {
  const { message } = useAntdStatic();
  const form = useForm<QuestionFormValues>({
    defaultValues: {
      question_text: "",
      question_type: ExamQuestionType.SingleChoice,
      options: [{ value: "" }, { value: "" }],
      answer_index: [],
      explanation_text: "",
    },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });
  const { isSubmitting } = form.formState;
  const { data: initData, isFetching, refetch } = useSuspenseQuery(getQuestionReviewNextQueryOption());
  const { data, mutateAsync } = useMutation({
    mutationFn(param: { review_id: string; body: QuestionCommitReviewParam }) {
      return api["/question/review/entity/:review_id/commit"].post({
        params: { review_id: param.review_id },
        body: param.body,
      });
    },
    onSuccess(res) {
      if (res.success) message.success("审核成功");
      else message.info("操作已被忽略");
    },
  });

  const reviewData = (data?.next ?? initData) as GetQuestionReviewNextResult;
  const item = reviewData.item;

  useEffect(() => {
    if (!item) return;
    replace((item.options ?? []).map((option) => ({ value: option.text })));
    form.reset({
      question_text: item.question_text,
      question_type: item.question_type,
      options: (item.options ?? []).map((option) => ({ value: option.text })),
      answer_index: item.answer_index,
      explanation_text: item.answer_text,
      remark: undefined,
      isPass: true,
    });
  }, [form, item, replace]);

  const questionType = form.watch("question_type");
  const answerIndex = form.watch("answer_index") ?? [];
  const currentOptions = form.watch("options") ?? [];
  const isPass = form.watch("isPass");

  useEffect(() => {
    const validValues = answerIndex.filter((value) => value >= 0 && value < currentOptions.length);
    if (validValues.length !== answerIndex.length) {
      form.setValue("answer_index", validValues);
    }
    if (questionType !== ExamQuestionType.MultipleChoice && validValues.length > 1) {
      form.setValue("answer_index", validValues.slice(0, 1));
    }
  }, [answerIndex, currentOptions.length, form, questionType]);

  if (!item || !reviewData.review_id) {
    return (
      <Empty
        description={
          <div>
            没有待审核的题目
            <Button type="link" onClick={() => refetch()} loading={isFetching}>
              刷新
            </Button>
          </div>
        }
      />
    );
  }

  const answerChoiceOptions = currentOptions.map((option, index) => ({
    label: option.value.trim() || `选项 ${index + 1}`,
    value: index,
  }));

  return (
    <div style={pageStyle}>
      <Typography.Title style={{ margin: 0 }} level={4}>
        题目审核
      </Typography.Title>

      <Card size="small" title="待审核内容" extra={<span>ID: {reviewData.review_id}</span>}>
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div>通过/拒绝：{reviewData.pass_count ?? 0} / {reviewData.reject_count ?? 0}</div>
          <Typography.Paragraph style={{ margin: 0 }}>{item.question_text}</Typography.Paragraph>
          <Space wrap>
            <Tag color="geekblue">{questionTypeLabel[item.question_type]}</Tag>
            {item.long_time && <Tag color="gold">长期有效</Tag>}
          </Space>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {(item.options ?? []).map((option, index) => (
              <li key={index}>{option.text}</li>
            ))}
          </ol>
        </Space>
      </Card>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            const optionValues = values.options.map((option) => option.value.trim()).filter(Boolean);
            const answerValues = values.answer_index.filter((value) => value >= 0 && value < optionValues.length);

            const body: QuestionCommitReviewParam = {
              is_passed: values.isPass,
              remark: values.remark,
              update: values.isPass
                ? {
                    question_id: reviewData.question_id!,
                    question_text: values.question_text,
                    question_type: values.question_type,
                    options: optionValues,
                    answer_index:
                      values.question_type === ExamQuestionType.MultipleChoice ? answerValues : answerValues.slice(0, 1),
                    explanation_text: values.explanation_text,
                  }
                : undefined,
            };

            return mutateAsync({ review_id: reviewData.review_id!, body });
          })}
        >
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {!reviewData.can_update_question && <Alert type="info" message="当前题目不允许在线修正" showIcon />}

            <Controller
              name="question_text"
              rules={{ required: isPass ? "请填写题目内容" : false }}
              render={({ field, fieldState }) => (
                <FieldBlock label="题目内容" error={fieldState.error?.message}>
                  <Input.TextArea {...field} autoSize={{ minRows: 3, maxRows: 6 }} status={getAntdErrorStatus(fieldState)} />
                </FieldBlock>
              )}
            />

            <Controller
              name="question_type"
              rules={{ required: isPass ? "请选择题型" : false }}
              render={({ field, fieldState }) => (
                <FieldBlock label="题型" error={fieldState.error?.message}>
                  <Radio.Group {...field} optionType="button" buttonStyle="solid">
                    <Radio.Button value={ExamQuestionType.SingleChoice}>单选</Radio.Button>
                    <Radio.Button value={ExamQuestionType.MultipleChoice}>多选</Radio.Button>
                    <Radio.Button value={ExamQuestionType.TrueOrFalse}>判断</Radio.Button>
                  </Radio.Group>
                </FieldBlock>
              )}
            />

            <FieldBlock label="选项">
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                {fields.map((field, index) => (
                  <div key={field.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Tag>{String.fromCharCode(65 + index)}</Tag>
                    <Controller
                      name={`options.${index}.value` as const}
                      rules={{ required: isPass ? "选项不能为空" : false }}
                      render={({ field, fieldState }) => (
                        <Input {...field} status={getAntdErrorStatus(fieldState)} placeholder={`选项 ${index + 1}`} />
                      )}
                    />
                    <Button danger disabled={fields.length <= 2} onClick={() => remove(index)}>
                      删除
                    </Button>
                  </div>
                ))}
                <div>
                  <Button onClick={() => append({ value: "" })}>添加选项</Button>
                </div>
              </Space>
            </FieldBlock>

            <Controller
              name="answer_index"
              rules={{
                validate: (value) => {
                  if (!isPass) return undefined;
                  if (!value?.length) return "请选择正确答案";
                  return undefined;
                },
              }}
              render={({ field, fieldState }) => (
                <FieldBlock label="正确答案" error={fieldState.error?.message}>
                  {questionType === ExamQuestionType.MultipleChoice ? (
                    <Checkbox.Group
                      options={answerChoiceOptions}
                      value={field.value}
                      onChange={(value) => field.onChange(value as number[])}
                    />
                  ) : (
                    <Radio.Group
                      options={answerChoiceOptions}
                      value={field.value?.[0]}
                      onChange={(event) => field.onChange([event.target.value])}
                    />
                  )}
                </FieldBlock>
              )}
            />

            <Controller
              name="explanation_text"
              rules={{ required: isPass ? "请填写解析" : false }}
              render={({ field, fieldState }) => (
                <FieldBlock label="解析" error={fieldState.error?.message}>
                  <Input.TextArea {...field} autoSize={{ minRows: 3, maxRows: 6 }} status={getAntdErrorStatus(fieldState)} />
                </FieldBlock>
              )}
            />

            <Controller
              name="remark"
              rules={{ required: isPass ? false : "请填写驳回原因" }}
              render={({ field, fieldState }) => (
                <FieldBlock label="审核备注" error={fieldState.error?.message}>
                  <Input.TextArea
                    {...field}
                    placeholder="审核意见会反馈给出题人"
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    status={getAntdErrorStatus(fieldState)}
                  />
                </FieldBlock>
              )}
            />

            <Controller
              name="isPass"
              rules={{ validate: (value) => (typeof value === "boolean" ? undefined : "请选择审核结果") }}
              render={({ field, fieldState }) => (
                <FieldBlock label="审核结果" error={fieldState.error?.message}>
                  <Radio.Group {...field} buttonStyle="solid">
                    <Radio.Button value={true}>通过</Radio.Button>
                    <Radio.Button value={false}>不通过</Radio.Button>
                  </Radio.Group>
                </FieldBlock>
              )}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button disabled={isPass === undefined} loading={isSubmitting} type="primary" htmlType="submit">
                提交审核
              </Button>
            </div>
          </Space>
        </form>
      </FormProvider>
    </div>
  );
}

function FieldBlock(props: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <Typography.Text style={{ display: "block", marginBottom: 6 }}>{props.label}</Typography.Text>
      {props.children}
      <FormErrorMessage message={props.error} />
    </div>
  );
}

const questionTypeLabel: Record<ExamQuestionType, string> = {
  [ExamQuestionType.SingleChoice]: "单选题",
  [ExamQuestionType.MultipleChoice]: "多选题",
  [ExamQuestionType.TrueOrFalse]: "判断题",
};

const pageStyle: React.CSSProperties = {
  margin: "auto",
  maxWidth: 760,
  height: "100%",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: 16,
};
