import { css } from "@emotion/css";

export const Container = css`
  height: 120px;

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

export const UserInfo = css`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 12px;
  margin-top: 24px;
`;
export const UserInfoCard = css`
  height: 100%;
  padding: 12px;
`;

export const UserName = css`
  display: flex;
  > b:first-of-type {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 60%;
  }
  gap: 0.5em;
  overflow: hidden;
  flex-wrap: nowrap;
`;
