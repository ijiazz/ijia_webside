import { createLazyFileRoute } from "@tanstack/react-router";

import { StudentIdCard, StudentIdCardBack } from "@/components/school/StudentIdCard.tsx";
import { toFileUrl } from "@/request/client.ts";
import * as styles from "@/lib/components/Page.tsx";
import { useSuspenseQueries } from "@tanstack/react-query";
import { CurrentUserProfileQueryOption, getCurrentUserInfoQueryOption } from "@/request/user.ts";
import { queryClient } from "@/request/client.ts";
import { BasicForm } from "./-components/center/BasicForm.tsx";
import { BindAccountList } from "./-components/center/BindAccountList.tsx";

export const Route = createLazyFileRoute("/_school/profile/center")({
  component: RouteComponent,
});

function RouteComponent() {
  const UserInfoQueryOption = getCurrentUserInfoQueryOption();
  const { profile, profileLoading, user, userLoading } = useSuspenseQueries({
    queries: [CurrentUserProfileQueryOption, { ...UserInfoQueryOption, staleTime: 60 * 1000 }],
    combine(result) {
      const [{ data: profile, isFetching: profileLoading }, { data: user, isFetching: userLoading }] = result;
      return {
        profile: {
          ...profile,
          bind_accounts: profile.bind_accounts.map((item) => ({ ...item, avatar_url: toFileUrl(item.avatar_url) })),
        },
        user,
        profileLoading,
        userLoading,
      };
    },
  });
  const invalidateProfile = () => {
    queryClient.invalidateQueries({ queryKey: CurrentUserProfileQueryOption.queryKey });
    queryClient.invalidateQueries({ queryKey: UserInfoQueryOption.queryKey });
  };

  return (
    <div className={styles.PagePadding}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <StudentIdCard
          targetClass={user.primary_class?.class_name}
          avatarUrl={user.avatar_url}
          id={user.user_id}
          name={user.nickname}
          isOfficial={user.is_official}
          date={user.profile.acquaintance_time ?? undefined}
        />
        <StudentIdCardBack />
      </div>
      <BindAccountList profileData={profile} profileLoading={profileLoading} onProfileChange={invalidateProfile} />
      <BasicForm
        userConfig={profile}
        classId={user.primary_class?.class_id}
        is_official={user.is_official}
        loading={profileLoading || userLoading}
        onProfileChange={invalidateProfile}
      />
    </div>
  );
}
