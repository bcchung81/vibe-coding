import { describe, expect, test } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  test("reads quoted cells with commas, quotes and line breaks", () => {
    const text = '﻿타임스탬프,"1. 어느 날 참여하나요?","2. 업무에서 AI를"\r\n2026,이틀 모두,"자료 조사, 엑셀 · 데이터 정리"\r\n2026,1일차만,"줄바꿈\n있음 ""인용"""\n';
    expect(parseCsv(text)).toEqual([
      ["타임스탬프", "1. 어느 날 참여하나요?", "2. 업무에서 AI를"],
      ["2026", "이틀 모두", "자료 조사, 엑셀 · 데이터 정리"],
      ["2026", "1일차만", '줄바꿈\n있음 "인용"'],
    ]);
  });

  test("keeps a last row without a line break", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
});
