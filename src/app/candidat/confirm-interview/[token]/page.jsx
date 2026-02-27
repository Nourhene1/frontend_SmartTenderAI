// app/candidat/confirm-interview/[token]/page.jsx
import CandidatConfirmInterview from "./CandidatConfirmInterview";

export default async function Page({ params }) {
  const { token } = await params;
  return <CandidatConfirmInterview token={token} />;
}