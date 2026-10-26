import { TopicPicker } from "../../components/topic-picker";
import { topicItems } from "../../lib/topics";

export const metadata = { title: "웹앱 주제" };

export default function TopicsPage() {
  return <TopicPicker items={topicItems()} />;
}
