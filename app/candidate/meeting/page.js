'use client';
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MeetingRoom from "@/components/MeetingRoom";

function Content() {
  const params = useSearchParams();
  const sessionId = params.get("s") || "demo-session-1";
  return <MeetingRoom isJudge={false} nextPath="/candidate/done" sessionId={sessionId} />;
}

export default function CandidateMeeting() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
