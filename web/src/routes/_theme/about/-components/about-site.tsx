import { Typography } from "antd";
const { Title, Paragraph } = Typography;

type AboutSiteProps = { id?: string };
export function AboutSite(props: AboutSiteProps) {
  const {} = props;
  return (
    <Typography id={props.id}>
      <Title level={2}>关于本站</Title>
      <Paragraph>
        IJIA 学院网站是由热心粉丝精心创建并持续运维的。我们致力于为 ijia
        粉丝们打造一个充满乐趣与美好回忆的专属空间，让大家能够在这里相聚、分享与交流。
      </Paragraph>
      <Paragraph>
        本站秉持开源理念，会不断更新完善，以呈现更多精彩内容。如果你有任何创意或建议，欢迎随时联系作者，让我们携手让
        IJIA 这个大家庭更加温馨、有趣。更多关于作者的信息，可查看 <a href="#author">关于作者</a>页面。
      </Paragraph>
      <Paragraph>
        在浏览过程中，如果你发现了任何 bug，可以前往
        <a href="https://github.com/ijiazz/ijia_website" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        提交 issue，或是直接联系作者。
      </Paragraph>
      <Paragraph>若发现网站存在漏洞，请及时告知作者，以保障网站的安全稳定运行。</Paragraph>
      <Paragraph>
        此外，如果你对本站充满热爱，渴望为其贡献一份力量，那么请查看“<a href="#contribute">为本站贡献</a>”栏目
        ，了解具体的参与方式，期待你的加入！
      </Paragraph>
    </Typography>
  );
}
