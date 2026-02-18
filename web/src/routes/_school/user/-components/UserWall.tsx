import { Link } from "@tanstack/react-router";
import { Avatar, Button } from "antd";
import * as styles from "./UserWall.css.ts";
import { useAntdStatic } from "@/provider/AntdProvider.tsx";
import { StudentIdCard } from "@/components/school/StudentIdCard.tsx";
import userCover from "../-img/user-cover.webp";
import { ArrowLeftOutlined, IdcardOutlined } from "@ant-design/icons";
import { cx } from "@emotion/css";
import { User } from "@/api.ts";

export type UserWallProps = {
  className?: string;
  classNames?: {
    userInfoCard?: string;
  };
  user: User;
};
export function UserWall(props: UserWallProps) {
  const { className, classNames = {}, user } = props;
  const { modal } = useAntdStatic();
  const viewStudentIdCard = () => {
    modal.info({
      title: `${user.nickname} 的学生证`,
      icon: null,
      content: (
        <StudentIdCard
          id={user.user_id}
          name={user.nickname}
          avatarUrl={user.avatar_url}
          isOfficial={user.is_official}
          date={user.profile.acquaintance_time}
        />
      ),
      okText: "关闭",
    });
  };

  return (
    <div className={cx(styles.Container, className)} style={{ backgroundImage: `url(${userCover})` }}>
      <div className={cx(styles.UserInfoCard, classNames.userInfoCard)}>
        <Link to="/wall">
          <Button icon={<ArrowLeftOutlined />} style={{ color: "inherit" }} size="small" type="text">
            首页
          </Button>
        </Link>
        <div className={styles.UserInfo}>
          <Avatar src={user.avatar_url} size="large" style={{ color: "#000" }}>
            {user.nickname}
          </Avatar>
          <div className={styles.UserName}>
            <b>{user.nickname}</b>
            <Button size="small" icon={<IdcardOutlined />} type="link" onClick={() => viewStudentIdCard()} />
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
