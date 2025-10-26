import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { BulletChatBox } from "@/lib/BulletChat/BulletChatBox.tsx";
import { genItems } from "./-utils/genItems.ts";
export const Route = createFileRoute("/test-page/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <BulletChatBox genData={genItems} style={{ background: "#999" }} />;
}
