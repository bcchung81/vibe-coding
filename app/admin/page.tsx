import { AdminLogin, AdminView } from "../../components/admin-view";
import { signedIn } from "../../lib/auth";
import { rosterStatus } from "../../lib/db";
import { topicItems } from "../../lib/topics";

export const metadata = { title: "관리" };

export default async function AdminPage() {
  if (!(await signedIn("admin"))) return <AdminLogin />;
  const titles = Object.fromEntries(topicItems().map((t) => [t.slug, t.title]));
  return <AdminView status={await rosterStatus()} titles={titles} />;
}
