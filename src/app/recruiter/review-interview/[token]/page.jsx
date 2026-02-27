// app/recruiter/review-interview/[token]/page.jsx
import RecruiterReviewCalendar from "./RecruiterReviewCalendar";

export default async function Page({ params }) {
  const { token } = await params;
  return <RecruiterReviewCalendar token={token} />;
}