import { ApiError, api } from "@/lib/api";
import { setStudentToken } from "@/lib/session";

export async function POST(req: Request) {
  const { code } = await req.json();
  try {
    const result = await api.studentLogin(code);
    await setStudentToken(result.access_token);
    return Response.json({ student: result.student });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    const message = err instanceof ApiError ? err.message : "Login failed.";
    return Response.json({ error: message }, { status });
  }
}
