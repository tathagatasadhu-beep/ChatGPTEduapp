import { ApiError, api } from "@/lib/api";
import { getStudentToken } from "@/lib/session";

export async function GET(req: Request) {
  const token = await getStudentToken();
  if (!token) return Response.json({ error: "Not authenticated." }, { status: 401 });

  const topicId = new URL(req.url).searchParams.get("topic_id");
  if (!topicId) return Response.json({ error: "topic_id is required." }, { status: 400 });

  try {
    const question = await api.nextQuestion(token, topicId);
    return Response.json(question);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : "Could not fetch the next question.";
    return Response.json({ error: message }, { status });
  }
}
