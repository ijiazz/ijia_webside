import React, { useEffect, useRef, useState } from "react";
import { CaptionType, Question, CaptionTip, CaptionFlow, Dialogue } from "@/lib/components/talk.tsx";
import styled from "@emotion/styled";
import { RefreshButton } from "@/lib/components/button.tsx";
import { be1Card, be2Card, comeAcross, finishSchool, verifyCard } from "./data.tsx";
import bg_audio from "./img/bg-audio.aac";

const pages: Dialogue[] = [comeAcross, finishSchool, verifyCard];
type StoryPageProps = {};
export function StoryPage(props: StoryPageProps) {
  const {} = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = audioRef.current!;
    // audio.play();
  }, [[]]);
  const [page, setPage] = useState(pages[0]);
  return (
    <div style={{ height: "100%" }} onClick={() => audioRef.current?.play()}>
      <audio ref={audioRef} src={bg_audio} loop></audio>
      <Card src={comeAcross.background.image_url} captionTip={comeAcross.captions[2]} />
      <Card src={finishSchool.background.image_url} captionTip={finishSchool.captions[0]} />
      <Card src={verifyCard.background.image_url} captionTip={verifyCard.captions[0]} />

      <Card src={be1Card.background.image_url} captionTip={be1Card.captions[0]} />
      <Card src={be2Card.background.image_url} captionTip={be2Card.captions[0]} />
    </div>
  );
}

function Card(props: { captionTip?: CaptionTip; src?: string }) {
  const { captionTip } = props;
  let question: Question | undefined;
  switch (captionTip?.type) {
    case CaptionType.QUESTION:
      question = captionTip as Question;
      break;

    default:
      break;
  }
  return (
    <CardCSS style={{ backgroundImage: `url(${props.src})` }}>
      <div></div>
      <div></div>
      <div style={{ width: "100%" }}>
        <h2 className="caption">
          <CaptionFlow text={captionTip?.text} />
        </h2>
        <SelectCSS>
          {question?.answers.map((item) => (
            <RefreshButton key={item.value} className="select-btn">
              {item.text}
            </RefreshButton>
          ))}
        </SelectCSS>
      </div>
    </CardCSS>
  );
}
const SelectCSS = styled.div`
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 12px;
  margin: 48px 0 48px 0;

  .select-btn {
    padding: 8px 16px;
  }
`;
const CardCSS = styled.div`
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  color: white;

  .caption {
    text-align: center;
  }
`;
