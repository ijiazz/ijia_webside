import { createLazyFileRoute } from "@tanstack/react-router";
import { css, cx } from "@emotion/css";
import { useWindowResize } from "@/lib/hook/window.ts";
import { LoginForm } from "./-components/LoginForm.tsx";

export const Route = createLazyFileRoute("/_theme/passport/_video_background/login")({
  component: RouteComponent,
});

export function RouteComponent() {
  const windowSize = useWindowResize();

  const isCenter = windowSize ? windowSize.height * 1.2 > windowSize.width : false;
  return (
    <div className={StyledPage}>
      <div className={cx("main", { center: isCenter })}>
        <div className="left-desc"> </div>

        <div className="right-form">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
const StyledPage = css`
  height: 100%;

  .main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    .left-desc {
      color: #fff;
      font-size: 48px;
      font-weight: bold;
    }
    .right-form {
      padding: 24px;
      max-width: min(400px, 100%);
    }
  }
  .main.center {
    justify-content: center;
    .left-desc {
      display: none;
    }
  }
  @media (min-width: 448px) {
    .login-form-container {
      padding: 0 24px;
    }
  }
`;
