import { DeepPartialSkipArrayKey, useForm } from "react-hook-form";
import { QuestionWork, QuestionWorkData } from "../../-components/question/QuestionWork.tsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { FromValues } from "./CreateForm.tsx";

export function CratePreview(props: { form: ReturnType<typeof useForm<FromValues>> }) {
  const { form } = props;
  const [formValues, setFormValues] = useState<DeepPartialSkipArrayKey<FromValues>>({});
  const previewData = useMemo(() => {
    return getQuestionWorkData(formValues);
  }, [formValues]);

  const [select, setSelect] = useState<number[]>([]);

  useInterval(() => {
    setFormValues(form.getValues());
  }, 1000);

  return (
    <div style={{ padding: "12px 16px", width: 500 }}>
      <h3>作答预览</h3>
      <span>考生作答时看到的题目节目</span>
      <QuestionWork data={previewData} correctIndexes={formValues.answer_index} value={select} onChange={setSelect} />
    </div>
  );
}
function useInterval(callback: () => void, interval: number) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => {
      cbRef.current();
    }, interval);
    return () => clearInterval(id);
  }, [interval]);
}
function getQuestionWorkData(value: DeepPartialSkipArrayKey<FromValues>) {
  return {
    ...value,
    index: 1,
    attachments: value.attachments?.filter((item) => item.text || item.file) as QuestionWorkData["attachments"],
    options: value.options?.filter((item) => item.text || item.file) as QuestionWorkData["options"],
  };
}
