import React from "react";
import { Answer, Question } from "./type.ts";

export type StatementProps<Key = string> = {
  question?: Question;
  onAnswer?: (answer: Answer<Key>) => void;
};
export function QuestionBoard(props: StatementProps) {
  return <div>Statement</div>;
}
