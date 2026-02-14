import { Typography } from "antd";

const { Title, Paragraph } = Typography;

type AboutAuthorProps = {};
export function AboutAuthor(props: AboutAuthorProps) {
  const {} = props;
  return (
    <Typography>
      <Title level={2}>关于作者</Title>
      <ul>
        <li>
          抖音：
          <a
            href="https://www.douyin.com/user/MS4wLjABAAAAZo60aZRT3eSWCoOaYSHFF2i-eoYyZKxzTCb7NMkOLGIiHXb3OLvAeicdznzvEjdG"
            target="_blank"
          >
            一维依_zZ
          </a>
        </li>
        <li>
          邮箱： <b>eaviyi@ijiazz.cn</b>
        </li>
      </ul>
      <Title level={4}>简介</Title>
      <Paragraph>00后前端程序员。身为IJIA，我想，或许我也能做些什么，为这份喜爱贡献一份力量</Paragraph>
      <Title level={4}>赞助作者</Title>
      无论多少，都是对作者莫大的鼓励，感谢！
      <Paragraph>
        <img src="/main/sponsor-0.jpg" style={{ maxWidth: 180, maxHeight: 400, objectFit: "cover" }}></img>
        <img src="/main/sponsor-1.jpg" style={{ maxWidth: 180, maxHeight: 400, objectFit: "cover" }}></img>
      </Paragraph>
    </Typography>
  );
}
