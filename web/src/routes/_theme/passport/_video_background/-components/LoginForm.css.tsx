import { css, cx } from "@emotion/css";

export const LoginFormCSS = css`
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 28px;

  background-color: #fff8;
  box-shadow: 0 0 2px #9b9b9b;
  backdrop-filter: blur(6px);
  border-radius: 4px;
  .logo {
    display: flex;
    align-items: center;
    gap: 1em;
    font-size: 32px;
    font-weight: bold;
  }
  .message {
    margin-bottom: 14px;
  }
  form {
    display: flex;
    flex-direction: column;
    width: 320px;
    max-width: 100%;

    a {
      color: #fff;
      text-shadow: #707070 0px 0px 2px;
    }
  }
`;
