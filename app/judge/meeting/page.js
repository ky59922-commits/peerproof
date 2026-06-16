import MeetingRoom from "@/components/MeetingRoom";

export default function JudgeMeeting() {
  return <MeetingRoom isJudge={true} nextPath="/judge/score" />;
}
