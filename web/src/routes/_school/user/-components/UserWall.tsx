import { Link } from "@tanstack/react-router";
import { Avatar, Button } from "antd";
import * as styles from "./UserWall.css.ts";
import { StudentIdCard } from "@/components/school/StudentIdCard.tsx";
import userCover from "../-img/user-cover.webp";
import { ArrowLeftOutlined, IdcardOutlined } from "@ant-design/icons";
import { cx } from "@emotion/css";
import { User } from "@/api.ts";
import { useModal } from "@/components/Modal.ts";

export type UserWallProps = {
  className?: string;
  classNames?: {
    userInfoCard?: string;
  };
  user: User;
};
export function UserWall(props: UserWallProps) {
  const { className, classNames = {}, user } = props;
  const modals = useModal();
  const viewStudentIdCard = () => {
    const modal = modals.open({
      title: `${user.nickname} 的学生证`,
      children: (
        <StudentIdCard
          id={user.user_id}
          name={user.nickname}
          avatarUrl={user.avatar_url}
          isOfficial={user.is_official}
          date={user.profile.acquaintance_time}
        />
      ),
      styles: {
        body: { display: "flex", justifyContent: "center" },
      },
      onOk: () => modals.close(modal.id),
      cancelText: null,
      cancelButtonProps: {
        style: { display: "none" },
      },
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
