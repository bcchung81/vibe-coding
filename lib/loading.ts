// Loading panel of the map demo (/topics/map): one row per call, saying what is running and what came back.
// Chip tones follow the hub's status chips (DESIGN.md "Chips"): done = solid, next = ochre fill, todo = dashed.

export type StepState = "wait" | "busy" | "done" | "sample" | "miss" | "skip" | "fail";
export type Step = { state: StepState; started?: number; ms?: number; count?: number };

export const STEPS = [
  { id: "map", name: "지도 바탕", where: "tiles.openfreemap.org", busy: "받는 중" },
  { id: "emf", name: "전자파 노출지수", where: "apis.data.go.kr · KCA getEmfExposureIndex", busy: "호출 중" },
  { id: "wifi", name: "와이파이 위치", where: "/api/wifi · KCA 지역별 와이파이 정보(내장)", busy: "호출 중" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
export type Steps = Record<StepId, Step>;

const seconds = (ms: number) => (ms < 100 ? "0.1초 미만" : `${(ms / 1000).toFixed(1)}초`);

export function stepText(step: Step, now: number, busyWord = "호출 중"): { chip: string; tone: "done" | "next" | "todo" | "fail"; detail: string } {
  switch (step.state) {
    case "wait":
      return { chip: "대기", tone: "todo", detail: "앞 단계가 끝나면" };
    case "busy":
      return { chip: busyWord, tone: "next", detail: step.started == null ? "" : seconds(now - step.started) };
    case "done":
      return { chip: "완료", tone: "done", detail: [step.count != null ? `${step.count}곳` : "", step.ms != null ? seconds(step.ms) : ""].filter(Boolean).join(" · ") };
    case "sample":
      return { chip: "대체", tone: "todo", detail: "실시간 실패 · 예시 데이터" };
    case "miss":
      return { chip: "없음", tone: "todo", detail: "주소를 찾지 못함" };
    case "skip":
      return { chip: "건너뜀", tone: "todo", detail: "주소 좌표가 없음" };
    case "fail":
      return { chip: "실패", tone: "fail", detail: "응답을 받지 못함" };
  }
}

// Nothing waiting or running any more
export function settled(steps: Steps) {
  return Object.values(steps).every((s) => s.state !== "wait" && s.state !== "busy");
}
