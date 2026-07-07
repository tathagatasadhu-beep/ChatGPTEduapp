// Cookie-based session helpers. Tokens are httpOnly so client-side JS never
// sees them — client components call same-origin Route Handlers, which read
// these cookies server-side and forward the bearer token to the FastAPI
// backend (see lib/api.ts). Only usable from Route Handlers / Server Actions;
// Server Components may read but not set/clear (Next.js restriction).
import { cookies } from "next/headers";

const PARENT_COOKIE = "eduquest_parent_token";
const STUDENT_COOKIE = "eduquest_student_token";

const STUDENT_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // matches APP_JWT_SECRET-signed token TTL in backend

export async function getParentToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(PARENT_COOKIE)?.value;
}

export async function getStudentToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(STUDENT_COOKIE)?.value;
}

export async function setParentToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(PARENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function setStudentToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STUDENT_TOKEN_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(PARENT_COOKIE);
  store.delete(STUDENT_COOKIE);
}
