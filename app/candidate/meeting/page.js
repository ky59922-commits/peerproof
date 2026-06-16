import MeetingRoom from "@/components/MeetingRoom";

export default function CandidateMeeting() {
  return <MeetingRoom isJudge={false} nextPath="/candidate/done" />;
}
