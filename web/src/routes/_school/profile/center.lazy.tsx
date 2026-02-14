import { createLazyFileRoute } from "@tanstack/react-router";

import { StudentIdCard, StudentIdCardBack } from "@/components/school/StudentIdCard.tsx";
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

  return (
    <div className={styles.PagePadding}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <StudentIdCard
          targetClass={data.primary_class?.class_name}
          avatarUrl={data.avatar_url}
          id={data.user_id.toString().padStart(5)}
          name={data.nickname}
          isOfficial={data.is_official}
          date={data.profile?.acquaintance_time ?? undefined}
        />
        <StudentIdCardBack />
      </div>
      <BindAccountList profileData={data} profileLoading={isFetching} onProfileChange={invalidateProfile} />
      <BasicForm userInfo={data} profileLoading={isFetching} onProfileChange={invalidateProfile} />
    </div>
  );
}
