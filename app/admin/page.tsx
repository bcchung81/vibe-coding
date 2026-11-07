import { AdminLogin, AdminView } from "../../components/admin-view";
import { signedIn } from "../../lib/auth";
import { courseInfo } from "../../lib/db";

export const metadata = { title: "관리" };

export default async function AdminPage() {
  if (!(await signedIn())) return <AdminLogin />;
  return <AdminView info={await courseInfo()} />;
}
