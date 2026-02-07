import { css } from "@emotion/css";

export const wrapper = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 14px;

  time {
    color: #888;
    font-style: italic;
  }
`;
export const row = css`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const reviewer = css`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const content = css`
  border: 1px solid #000;
  padding: 8px;
  border-radius: 4px;
`;
