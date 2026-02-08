import { CSSProperties, ReactNode } from "react";
import { css, cx } from "@emotion/css";

export function RefreshButton(props: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  const { children, className, style, ...reset } = props;
  return (
    <div {...reset} style={style} className={cx(RefreshButtonCSS, className)}>
      {children}
    </div>
  );
}

const RefreshButtonCSS = css`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #7e97b8;
  background-color: #e0e8ef;
  border-style: solid;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.333);
  border-radius: 40px;
  padding: 12px 24px;
  transform: translate(0px, 0px) rotate(0deg);
  transition: 0.2s;
  box-shadow:
    -4px -2px 16px 0px #ffffff,
    4px 2px 16px 0px rgb(95 157 231 / 48%);

  :hover {
    color: #516d91;
    background-color: #e5edf5;
    box-shadow:
      -2px -1px 8px 0px #ffffff,
      2px 1px 8px 0px rgb(95 157 231 / 48%);
  }

  :active {
    box-shadow: none;
  }
`;
