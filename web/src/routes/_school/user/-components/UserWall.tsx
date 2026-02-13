import { getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Avatar } from "antd";
import * as styles from "./UserWall.css.ts";
import { useAntdStatic } from "@/provider/AntdProvider.tsx";
import { StudentIdCard, StudentIdCardBack } from "@/components/school/StudentIdCard.tsx";

export function UserWall() {
  const { data: basicUser } = useSuspenseQuery(getCurrentUserInfoQueryOption());
  const { modal } = useAntdStatic();
  const viewStudentIdCard = () => {
    modal.info({
      title: `${basicUser.nickname || basicUser.user_id} 的学生证`,
      children: (
        <div>
          <StudentIdCard />
          <StudentIdCardBack />
        </div>
      ),
    });
  };
  return (
    <div className={styles.Container}>
      <div className={styles.UserInfoCard}>
        <Link to={"/wall"}>返回</Link>
        <div className={styles.UserInfo}>
          <Avatar src={basicUser.avatar_url} onClick={() => viewStudentIdCard()}>
            {basicUser.nickname}
          </Avatar>
          <div>{basicUser.nickname ?? basicUser.user_id}</div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
