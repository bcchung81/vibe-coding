import { DeckFrame } from "../../components/deck-frame";

export const metadata = { title: "발표" };

// The class deck inside the hub: the menu stays on top, the deck fills the content area
export default function SlidesPage() {
  return (
    <div className="content">
      <DeckFrame />
    </div>
  );
}
