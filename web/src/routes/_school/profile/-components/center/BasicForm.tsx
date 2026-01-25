import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Checkbox, DatePicker, Form, message, Select, Space, Spin, Tooltip, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { UserInfoDto } from "@/api.ts";
import { api } from "@/common/http.ts";
import dayjs, { Dayjs } from "dayjs";
import { useThemeToken } from "@/provider/mod.tsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PublicClassListQueryOption } from "@/request/class.ts";

type BasicFormData = {
  received_live?: boolean;
  primary_class_id?: number | null;
  acquaintance_time?: Dayjs | null;
  /** 是否开启年度评论统计 */
  comment_stat_enabled?: boolean;
};
export function BasicForm(props: { userInfo: UserInfoDto; profileLoading?: boolean; onProfileChange?(): void }) {
  const { userInfo, profileLoading, onProfileChange } = props;

  const [form] = Form.useForm<BasicFormData>();
  const [isChanged, setIsChanged] = useState(false);

  const defaultData = useMemo((): BasicFormData => {
    const pf = userInfo.profile ?? { acquaintance_time: null, comment_stat_enabled: false, live_notice: false };
    return {
      received_live: pf.live_notice ?? false,
      primary_class_id: userInfo.primary_class?.class_id ?? null,
      acquaintance_time: pf.acquaintance_time && dayjs(pf.acquaintance_time),
      comment_stat_enabled: pf.comment_stat_enabled,
    };
  }, [userInfo]);
  useEffect(() => {
    form.setFieldsValue(defaultData);
  }, [defaultData]);
  const { mutateAsync: onUpdate, isPending } = useMutation({
    mutationFn: async function (formData: BasicFormData) {
      await api["/user/profile"].patch({
        body: {
          notice_setting: {
            live: formData.received_live,
          },
          acquaintance_time: formData.acquaintance_time?.toISOString() ?? null,
          comment_stat_enabled: formData.comment_stat_enabled,
          primary_class_id: formData.primary_class_id ?? null,
        },
      });
    },
    onSuccess: () => {
      message.success("已修改");
      setIsChanged(false);
      onProfileChange?.();
    },
  });

  const theme = useThemeToken();

  return (
    <div>
      <Spin spinning={profileLoading}>
        <Space size="large" align="baseline">
          <Typography.Title level={5}>基础设置</Typography.Title>
          {isChanged && (
            <Space>
              <Button
                size="small"
                onClick={() => {
                  form.setFieldsValue(defaultData ?? {});
                  setIsChanged(false);
                }}
              >
                取消
              </Button>
              <Button
                size="small"
                loading={isPending}
                onClick={() => {
                  onUpdate(form.getFieldsValue());
                }}
                type="primary"
              >
                保存
              </Button>
            </Space>
          )}
        </Space>
        {userInfo.is_official || (
          <div style={{ color: theme.colorWarningText, margin: "0 0 14px 0" }}>部分信息需要绑定平台账号后才能修改</div>
        )}
        <Form
          form={form}
          onValuesChange={(value, values) => {
            if (!isChanged) setIsChanged(true);
          }}
        >
          <Form.Item
            name="primary_class_id"
            label={
              <Space>
                班级
                <Tooltip title="选择班级后，可代表班级参加 IJIA 学院的考试，并可以生成班级头像大合照">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <PublicClassSelect disabled={!userInfo.is_official} />
          </Form.Item>
          <Form.Item
            name="acquaintance_time"
            label={
              <Space>
                纪念日
                <Tooltip title="将根据这个日期为你推送纪念日邮件和个性化壁纸">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <DatePicker />
          </Form.Item>
          <Form.Item label={null} name="received_live" valuePropName="checked">
            <Checkbox>
              <Space>
                接收直播通知
                <Tooltip title="佳佳直播时，将通过邮件发送通知。你可能需要将 school@ijiazz.cn 添加到白名单">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            </Checkbox>
          </Form.Item>
          <Form.Item label={null} name="comment_stat_enabled" valuePropName="checked">
            <Checkbox disabled={!userInfo?.is_official}>
              <Space>
                年度评论统计
                <Tooltip title="如果勾选，将在年度(12月份)统计时统计(抽样)你在佳佳作品的评论数，然后生成头像排名">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            </Checkbox>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
}
function PublicClassSelect(props: { value?: number; onChange?(value: number): void; disabled?: boolean }) {
  const token = useThemeToken();

  const { data, isPending } = useQuery({
    ...PublicClassListQueryOption,
    staleTime: 5 * 60 * 1000,
    select({ items }) {
      return items.map((item) => ({
        ...item,
        label: (
          <Space>
            <span>{item.class_name}</span>
            {item.description ? (
              <span style={{ fontSize: token.fontSizeSM, color: token.colorTextDescription }}>{item.description}</span>
            ) : undefined}
          </Space>
        ),
        value: item.class_id,
      }));
    },
  });
  return (
    <Select
      {...props}
      style={{ minWidth: 100, maxWidth: 200 }}
      allowClear
      loading={isPending}
      options={data}
      showSearch={{
        filterOption: (value, option) => {
          if (!option) return false;
          return option.class_name.toUpperCase().includes(value.toUpperCase());
        },
      }}
      placeholder="选择班级"
    />
  );
}
