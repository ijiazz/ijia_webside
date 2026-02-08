import { createLazyFileRoute } from "@tanstack/react-router";

import { StudentIdCard, StudentIdCardBack } from "@/components/school/StudentIdCard.tsx";
import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useMemo, useState } from "react";
import { toFileUrl } from "@/request/client.ts";
import * as styles from "@/lib/components/Page.tsx";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CurrentUserProfileQueryOption } from "@/request/user.ts";
import { queryClient } from "@/request/client.ts";
import { BasicForm } from "./-components/center/BasicForm.tsx";
import { BindAccountList } from "./-components/center/BindAccountList.tsx";

export const Route = createLazyFileRoute("/_school/profile/center")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isFetching } = useSuspenseQuery({
    ...CurrentUserProfileQueryOption,
    staleTime: 60 * 1000,
    select: (res) => ({
      ...res,
      bind_accounts: res.bind_accounts.map((item) => ({ ...item, avatar_url: toFileUrl(item.avatar_url) })),
    }),
  });
  const invalidateProfile = () => {
    queryClient.invalidateQueries({ queryKey: CurrentUserProfileQueryOption.queryKey });
  };
  const [zoom, setZoom] = useState(1);

  const date = useMemo(() => {
    const time = data.profile?.acquaintance_time;
    if (!time) return undefined;
    const date = new Date(time);

    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, `0`)}-${date.getDate().toString().padStart(2, `0`)}`;
  }, [data]);

  return (
    <div className={styles.PagePadding}>
      <Button
        icon={zoom === 1 ? <ZoomInOutlined /> : <ZoomOutOutlined />}
        onClick={() => setZoom((size) => (size === 1 ? 2 : 1))}
      >
        {zoom === 1 ? "放大" : "缩小"}
      </Button>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <StudentIdCard
          className={data?.primary_class?.class_name}
          avatarUrl={data?.avatar_url}
          id={data?.user_id.toString().padStart(5)}
          name={data?.nickname}
          isOfficial={data?.is_official}
          scale={zoom}
          date={date}
        />
        <StudentIdCardBack scale={zoom} />
      </div>
      <BindAccountList profileData={data} profileLoading={isFetching} onProfileChange={invalidateProfile} />
      <BasicForm userInfo={data} profileLoading={isFetching} onProfileChange={invalidateProfile} />
    </div>
  );
}
