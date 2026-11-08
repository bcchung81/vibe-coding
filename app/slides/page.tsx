import { Band } from "../../components/band";
import { DeckFrame } from "../../components/deck-frame";

export const metadata = { title: "발표" };

// The class deck inside the hub: the menu stays on top, the deck fills the content area
export default function SlidesPage() {
  return (
    <>
      <Band title="발표" lead="→ · Space 로 넘기고, F 로 전체 화면. 첫 장에서 1일차 · 2일차를 고릅니다." />
      <div className="content">
        <DeckFrame />
      </div>
    </>
  );
}
