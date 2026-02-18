import { getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Avatar, Button } from "antd";
import * as styles from "./UserWall.css.ts";
import { useAntdStatic } from "@/provider/AntdProvider.tsx";
import { StudentIdCard } from "@/components/school/StudentIdCard.tsx";
import userCover from "../-img/user-cover.png";
import { ArrowLeftOutlined, IdcardOutlined } from "@ant-design/icons";
import { cx } from "@emotion/css";

export type UserWallProps = {
  className?: string;
  classNames?: {
    userInfoCard?: string;
  };
};
export function UserWall(props: UserWallProps) {
  const { className, classNames = {} } = props;
  const { data: basicUser } = useSuspenseQuery(getCurrentUserInfoQueryOption());
  const { modal } = useAntdStatic();
  const viewStudentIdCard = () => {
    modal.info({
      title: `${basicUser.nickname} 的学生证`,
      icon: null,
      content: (
        <StudentIdCard
          id={basicUser.user_id}
          name={basicUser.nickname}
          avatarUrl={basicUser.avatar_url}
          isOfficial={basicUser.is_official}
          date={basicUser.profile.acquaintance_time}
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
          <Avatar src={basicUser.avatar_url} size="large" style={{ color: "#000" }}>
            {basicUser.nickname}
          </Avatar>
          <div className={styles.UserName}>
            <b>{basicUser.nickname}</b>
            <Button size="small" icon={<IdcardOutlined />} type="link" onClick={() => viewStudentIdCard()} />
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
