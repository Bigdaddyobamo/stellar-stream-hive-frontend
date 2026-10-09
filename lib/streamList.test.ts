import { describe, expect, it } from "vitest";
import { countByFilter, csvCell, filterStreams, matchesFilter, streamsToCsv } from "./streamList";
import type { Stream, StreamStatus } from "@/types";

function stream(id: string, status: StreamStatus, overrides: Partial<Stream> = {}): Stream {
  return {
    id,
    sender: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7",
    recipient: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
    token: { contractId: "CTOKEN", symbol: "XLM", decimals: 7 },
    totalAmount: "15000000",
    withdrawnAmount: "5000000",
    startLedger: 100,
    endLedger: 200,
    startTime: 0,
    endTime: 0,
    cancellable: true,
    status,
    ...overrides,
  };
}

const all = [
  stream("1", "scheduled"),
  stream("2", "cliff"),
  stream("3", "active"),
  stream("4", "completed"),
  stream("5", "cancelled"),
];

describe("filtering", () => {
  it("'live' covers every state that can still accrue", () => {
    expect(filterStreams(all, "live").map((s) => s.id)).toEqual(["1", "2", "3"]);
  });
  it("'all' returns the same list", () => {
    expect(filterStreams(all, "all")).toBe(all);
  });
  it("selects terminal states exactly", () => {
    expect(filterStreams(all, "completed").map((s) => s.id)).toEqual(["4"]);
    expect(filterStreams(all, "cancelled").map((s) => s.id)).toEqual(["5"]);
    expect(matchesFilter(all[3], "live")).toBe(false);
  });
  it("counts are consistent with the filters", () => {
    expect(countByFilter(all)).toEqual({ all: 5, live: 3, completed: 1, cancelled: 1 });
    expect(countByFilter([])).toEqual({ all: 0, live: 0, completed: 0, cancelled: 0 });
  });
});

describe("csvCell", () => {
  it("passes plain values through", () => {
    expect(csvCell("abc")).toBe("abc");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(undefined)).toBe("");
  });
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
});

describe("streamsToCsv", () => {
  it("emits a header and one row per stream with human-readable amounts", () => {
    const csv = streamsToCsv([stream("9", "active", { cliffLedger: 120 })]);
    const [header, row] = csv.trim().split("\r\n");
    expect(header).toBe(
      "id,status,sender,recipient,token,total_amount,withdrawn,start_ledger,end_ledger,cliff_ledger,cancellable"
    );
    expect(row).toBe(
      "9,active,GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7,GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H,XLM,1.5,0.5,100,200,120,true"
    );
  });
  it("leaves the cliff column empty when there is none", () => {
    expect(streamsToCsv([stream("1", "active")]).trim().split("\r\n")[1]).toMatch(/,200,,true$/);
  });
  it("is header-only for an empty list", () => {
    expect(streamsToCsv([]).trim().split("\r\n")).toHaveLength(1);
  });
});
