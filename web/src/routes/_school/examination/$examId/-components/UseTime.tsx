import { useEffect, useMemo, useState } from "react";
import { Typography } from "antd";
import { ExaminationQuestionOutput } from "@ijia/api-types";
import { css } from "@emotion/css";
import { formatTimeToString } from "@/common/time.ts";

type UseTimeProps = { question: NonNullable<ExaminationQuestionOutput["question"]>; currentAnswered: boolean };

export function UseTime(props: UseTimeProps) {
  const { question, currentAnswered } = props;
  const [now, setNow] = useState(Date.now());

  const { remainingMs: initRemainingMs } = useMemo(
    () => calc(now, new Date(question.start_time), question.time_limit),
    [question],
  );
  const { remainingSeconds, usedSeconds, remainingMs } = useMemo(
    () => calc(now, new Date(question.start_time), question.time_limit),
    [now],
  );
  useEffect(() => {
    if (currentAnswered) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [currentAnswered]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "end", marginBottom: 12 }}>
      {!question.time_limit && <Typography.Text type="secondary">用时：{usedSeconds} </Typography.Text>}
      {typeof initRemainingMs === "number" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <div className={ProgressCSS}>
            <div style={{ animationDuration: `${initRemainingMs}ms` }} />
          </div>
          剩余时间：
          {remainingSeconds}
        </div>
      )}
    </div>
  );
}
const ProgressCSS = css`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;

  background: var(--ant-color-fill);
  & > div {
    height: 100%;
    background: var(--ant-color-primary);
    width: 50%;

    animation-name: progress;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }
  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;
function calc(now: number, start_time: Date, time_limit?: number | null) {
  const startAt = start_time.getTime();
  const useMs = now - startAt;
  if (!time_limit) return { usedSeconds: formatTimeToString(useMs) };
  const timeLimit = time_limit * 1000;
  const remainingMs = Math.max(timeLimit - useMs, 0);

  return {
    remainingMs,
    remainingSeconds: formatTimeToString(remainingMs),
    usedSeconds: formatTimeToString(useMs),
  };
}
