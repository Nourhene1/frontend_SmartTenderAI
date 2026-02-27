// app/candidat/reschedule-interview/[token]/page.jsx
import CandidatRescheduleInterview from "./CandidatRescheduleInterview";

export default async function Page({ params }) {
  const { token } = await params;
  return <CandidatRescheduleInterview token={token} />;
}