import { LoginFlow } from "../../components/login-flow";
import { signedIn } from "../../lib/auth";
import { findStudent } from "../../lib/db";

export const metadata = { title: "로그인" };

export default async function LoginPage() {
  const session = await signedIn("student");
  const me = session && (await findStudent(session.id));
  return <LoginFlow me={me ? { name: me.name, team: me.team } : undefined} />;
}
