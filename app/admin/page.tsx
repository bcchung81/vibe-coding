import { AdminView } from "../../components/admin-view";
import { DemoNote } from "../../components/demo-note";

export const metadata = { title: "관리" };

export default function AdminPage() {
  return (
    <>
      <DemoNote />
      <AdminView />
    </>
  );
}
