import { Typography } from "antd";
import React from "react";
import { Link } from "react-router";
const { Title, Paragraph } = Typography;
export function Contribute() {
  return (
    <Typography>
      <Title level={2}>为本站贡献</Title>
      <Paragraph>
        希望这份“贡献指南”能让大家更清晰地了解如何参与贡献，期待您的积极参与，让我们共同打造一个更美好的 IJIA
        学院网站！以下是您可以参与贡献的几种方式：
      </Paragraph>
      <Title level={4}>一、技术贡献</Title>
      <Paragraph>
        如果您具备一定的网站开发能力，欢迎在 IJIA 学院网站的
        <Link to="https://github.com/ijiazz/ijia_webside" target="_blank">
          GitHub仓库
        </Link>
        上参与我们的开源项目。您可以通过提交修复、功能改进或优化等相关的代码为网站贡献力量。在参与前，请务必仔细阅读
        <Link to="https://github.com/ijiazz/ijia_website/blob/main/CONTRIBUTING.md">《GitHub 贡献指南》</Link>
        ，了解代码规范、提交流程等相关要求，以确保您贡献的代码能够顺利合并。
      </Paragraph>
      <Title level={4}>二、创意与建议</Title>
      <Paragraph>
        你可以向作者提出建议，无论您是关于网站功能的优化、内容的丰富，还是设计风格的改进。非常欢迎您的建议和意见。您可以通过以下几种方式向作者反馈：
        <ul>
          <li>通过 GitHub issue 提交建议，这种方式便于我们对问题进行跟踪和管理，也方便您随时查看建议的处理进度</li>
          <li>您也可以选择通过抖音私信直接联系作者，或者在抖音上发布视频并 @作者，分享您的想法和建议</li>
          <li>
            您也可以给作者发送邮件，详细阐述您的建议，见<Link to="#author">关于作者</Link>
          </li>
        </ul>
      </Paragraph>
      <Title level={4}>三、内容贡献</Title>
      <Paragraph>
        提供网站素材：如果您有合适的图片、视频、音频等素材，且愿意分享给网站使用，可以通过邮箱 eaviyi@ijiazz.cn
        与我们联系。请在邮件中注明素材的来源、使用授权等相关信息，以便我们确认其合法性和适用性。您的素材将为网站增添更多色彩和活力。
      </Paragraph>
      <Title level={4}>四、支持与赞助</Title>
      <Paragraph>
        您可以直接赞助作者，无论多少，都是对作者莫大的鼓励。赞助渠道见<Link to="#author">关于作者</Link>
      </Paragraph>
    </Typography>
  );
}
