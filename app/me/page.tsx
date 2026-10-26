import { DemoNote } from "../../components/demo-note";
import { MyProject } from "../../components/my-project";

export const metadata = { title: "내 프로젝트" };

export default function MyProjectPage() {
  return (
    <>
      <DemoNote />
      <MyProject />
    </>
  );
}
