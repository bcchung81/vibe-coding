// 갤러리 예시 데이터 — 이름 · 앱 · 주소는 모두 가짜다. S3에서 DB(projects · likes)로 바뀐다.
export type DemoProject = {
  id: number;
  name: string;
  team: string;
  app: string;
  tagline: string;
  url: string;
  likes: number;
  updatedAt: number;
};

export const DEMO_PROJECTS: DemoProject[] = [
  { id: 1, name: "김가람", team: "1팀", app: "우산 챙겨?", tagline: "출근 시간대 강수확률만 크게 보여 줍니다", url: "https://umbrella-check.vercel.app", likes: 12, updatedAt: 9 },
  { id: 2, name: "최라온", team: "2팀", app: "우리동네 약국", tagline: "지금 문 연 약국을 가까운 순으로", url: "https://open-pharmacy.vercel.app", likes: 9, updatedAt: 7 },
  { id: 3, name: "조새봄", team: "3팀", app: "버스 언제 와", tagline: "자주 타는 정류장 세 곳만 모아 봅니다", url: "https://bus-when.vercel.app", likes: 9, updatedAt: 11 },
  { id: 4, name: "임하람", team: "4팀", app: "미세먼지 출근길", tagline: "출근 경로의 미세먼지를 한 줄로", url: "https://dust-commute.vercel.app", likes: 6, updatedAt: 5 },
  { id: 5, name: "서다솜", team: "5팀", app: "도서관 빈자리", tagline: "열람실 남은 좌석을 실시간으로", url: "https://library-seats.vercel.app", likes: 4, updatedAt: 12 },
  { id: 6, name: "이나래", team: "1팀", app: "공공 주차장 찾기", tagline: "남은 주차면이 많은 곳부터", url: "https://park-finder.vercel.app", likes: 3, updatedAt: 3 },
  { id: 7, name: "강바다", team: "2팀", app: "전기차 충전소", tagline: "지금 비어 있는 충전기만 표시", url: "https://ev-free.vercel.app", likes: 2, updatedAt: 8 },
  { id: 8, name: "한가온", team: "4팀", app: "축제 달력", tagline: "이번 달 우리 지역 행사 모음", url: "https://local-festa.vercel.app", likes: 1, updatedAt: 10 },
  { id: 9, name: "윤아라", team: "3팀", app: "재활용 요일", tagline: "우리 동네 분리배출 요일 알림", url: "https://recycle-day.vercel.app", likes: 0, updatedAt: 13 },
];
