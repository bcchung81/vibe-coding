import { DemoNote } from "../../components/demo-note";
import { LoginFlow } from "../../components/login-flow";

export const metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <>
      <DemoNote />
      <LoginFlow />
    </>
  );
}
