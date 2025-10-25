import React, { createContext, useContext } from "react";

export type ScreenEffects = {
  birthday?: boolean;
};
function getEffects(): ScreenEffects {
  return {
    birthday: isBirthDay(),
  };
}

const isBirthDay = () => {
  const now = new Date();
  const beijingOffset = 8 * 60; // 北京时间 UTC+8
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijing = new Date(utc + beijingOffset * 60000);
  return beijing.getMonth() === 9 && beijing.getDate() === 28;
};

const Context = createContext<ScreenEffects>({});

export function useScreenEffects() {
  return useContext(Context);
}
const effects = getEffects();
export function ScreenEffectsProvider(props: React.PropsWithChildren) {
  return <Context value={effects}>{props.children}</Context>;
}

export const MEDIA_CHECK = `(max-width: 500px) or (max-height: 500px)`;

export function useScreenMin() {
  const body = document.body;

  return body.clientWidth * body.clientHeight < 370944;
}
