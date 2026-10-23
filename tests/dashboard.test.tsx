import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createSupabaseMock } from "./supabase-mock";

const { mock } = vi.hoisted(() => ({
  mock: {} as ReturnType<typeof import("./supabase-mock").createSupabaseMock>,
}));

vi.mock("@/lib/supabase", () => ({ get supabase() { return mock.client; } }));
vi.mock("@/components/ScrollReveal", () => ({ ScrollReveal: () => null }));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));

import {
  ageBadgeClass,
  computeMonthly,
  daysSince,
  downloadCsv,
  isOpen,
  monthKey,
  monthKeyParam,
  parseMonthParam,
  parsePeriodParams,
  previousPeriod,
  makePeriod,
  type RequestRow,
} from "@/lib/dashboard";
import { formatCurrency, formatFullDate } from "@/lib/format";
import AdminDashboardPage from "@/app/admin/page";

const NOW = new Date("2026-10-23T15:00:00+07:00");

const req = (id: number, date: string | null, status: string, cost: number | null = null): RequestRow => ({
  maintenance_request_id: id,
  description: `รายละเอียด ${id}`,
  status,
  reported_date: date,
  product_id: id,
  room_id: 1,
  repair_cost: cost,
  products: { product_name: `ครุภัณฑ์ ${id}` },
});

const seed = (requests: RequestRow[]) => {
  Object.assign(mock, createSupabaseMock());
  mock.setTable("rooms", { data: [{ room_id: 1, room_number: "101", floor: "1", rent_price: 3000 }] });
  mock.setTable("user_extra", { data: [{ userName: "101", email: "a@dorm.com" }] });
  mock.setTable("maintenance_request", { data: requests });
  mock.setTable("room_asset", { data: [] });
  mock.setTable("status", { data: [] });
};

describe("UT-DASH: การประมวลผลสถิติ", () => {
  it("UT-DASH-01 สรุปจำนวนการแจ้งซ่อมและค่าซ่อมรายเดือนย้อนหลัง 12 เดือน", () => {
    const rows = [
      req(1, "2026-10-01T10:00:00+07:00", "สถานะแจ้งซ่อม", 200),
      req(2, "2026-10-20T10:00:00+07:00", "สถานะเสร็จสมบรูณ์", 150.5),
      req(3, "2026-09-15T10:00:00+07:00", "สถานะเสร็จสมบรูณ์", 300),
      req(4, "2025-10-31T10:00:00+07:00", "สถานะเสร็จสมบรูณ์", 999), // 13 months back: outside the window
      req(5, null, "สถานะแจ้งซ่อม", 50), // no date: skipped
    ];
    const m = computeMonthly(rows, NOW.getTime());
    expect(m).toHaveLength(12);
    expect(m[11]).toMatchObject({ label: "ต.ค.", year: 2026, count: 2, cost: 350.5 });
    expect(m[10]).toMatchObject({ label: "ก.ย.", count: 1, cost: 300 });
    expect(m[0]).toMatchObject({ label: "พ.ย.", year: 2025, count: 0 });
    expect(m.reduce((s, b) => s + b.count, 0)).toBe(3);
  });

  it("UT-DASH-02 สรุปรายเดือนข้ามปี (เดือนมกราคม)", () => {
    const jan = new Date("2027-01-05T09:00:00+07:00").getTime();
    const m = computeMonthly([req(1, "2026-12-31T23:30:00+07:00", "สถานะแจ้งซ่อม")], jan);
    expect(m[11]).toMatchObject({ label: "ม.ค.", year: 2027, count: 0 });
    expect(m[10]).toMatchObject({ label: "ธ.ค.", year: 2026, count: 1 });
  });

  it("UT-DASH-03 คำนวณจำนวนวันที่งานซ่อมค้างและระดับความเร่งด่วน", () => {
    const now = NOW.getTime();
    expect(daysSince("2026-10-16T15:00:00+07:00", now)).toBe(7);
    expect(daysSince(null, now)).toBe(0);
    expect(daysSince("2026-10-30T00:00:00+07:00", now)).toBe(0); // future dates never go negative
    expect(ageBadgeClass(2)).toContain("slate");
    expect(ageBadgeClass(3)).toContain("amber");
    expect(ageBadgeClass(7)).toContain("red");
    expect(isOpen("สถานะกำลังดำเนินการ")).toBe(true);
    expect(isOpen("สถานะเสร็จสมบรูณ์")).toBe(false);
  });

  it("UT-DASH-04 แปลงค่าเดือนจาก URL (?month=YYYY-MM)", () => {
    const oct = monthKey(new Date(2026, 9, 1));
    expect(parseMonthParam("2026-10")).toBe(oct);
    expect(monthKeyParam(oct)).toBe("2026-10");
    expect(parseMonthParam("2026-13")).toBeNull();
    expect(parseMonthParam("2026-00")).toBeNull();
    expect(parseMonthParam("abc")).toBeNull();
    expect(parseMonthParam("2026-1")).toBeNull();
    expect(parseMonthParam(null)).toBeNull();
  });

  it("UT-DASH-05 แสดงผลจำนวนเงินและวันที่เป็นรูปแบบภาษาไทย", () => {
    expect(formatCurrency(15500)).toBe("15,500 บาท");
    expect(formatCurrency(350.5)).toBe("350.5 บาท");
    expect(formatCurrency(null)).toBe("0 บาท");
    expect(formatFullDate("2026-10-23T08:25:00Z")).toBe("23 ตุลาคม 2569 เวลา 15:25 น.");
    expect(formatFullDate(null)).toBe("-");
    expect(formatFullDate("ไม่ใช่วันที่")).toBe("ไม่ใช่วันที่");
  });

  it("UT-DASH-06 ส่งออกรายงานเป็นไฟล์ CSV ที่เปิดภาษาไทยใน Excel ได้", async () => {
    let blob: Blob | null = null;
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), "blob:x")) as any;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadCsv("report.csv", [["ห้อง", "รายละเอียด"], ["101", 'ก๊อก "รั่ว", น้ำหยด']]);

    expect(click).toHaveBeenCalled();
    const buffer = await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob!);
    });
    const bytes = new Uint8Array(buffer);
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM
    const text = new TextDecoder().decode(bytes.slice(3));
    expect(text).toBe('"ห้อง","รายละเอียด"\r\n"101","ก๊อก ""รั่ว"", น้ำหยด"');
  });
});

describe("UT-DASH: ช่วงเวลาของตัวกรอง (วัน/เดือน/ปี)", () => {
  it("UT-DASH-13 สร้างช่วงเวลารายวัน รายเดือน และรายปี", () => {
    const d = new Date(2026, 9, 23, 15, 0);
    const day = makePeriod("day", d);
    expect(day).toMatchObject({ param: "2026-10-23", label: "23 ต.ค. 2569" });
    expect(day.end - day.start).toBe(24 * 60 * 60 * 1000);
    expect(makePeriod("month", d)).toMatchObject({ param: "2026-10", label: "ต.ค. 2569" });
    expect(makePeriod("year", d)).toMatchObject({ param: "2026", label: "ปี 2569" });
  });

  it("UT-DASH-14 หาช่วงเวลาก่อนหน้าเพื่อเปรียบเทียบค่าซ่อม (ข้ามเดือนและข้ามปี)", () => {
    expect(previousPeriod(makePeriod("day", new Date(2026, 0, 1))).param).toBe("2025-12-31");
    expect(previousPeriod(makePeriod("month", new Date(2026, 0, 15))).param).toBe("2025-12");
    expect(previousPeriod(makePeriod("year", new Date(2026, 5, 1))).param).toBe("2025");
  });

  it("UT-DASH-15 อ่านช่วงเวลาจาก URL และปฏิเสธค่าที่ผิดรูปแบบ", () => {
    const parse = (q: string) => parsePeriodParams(new URLSearchParams(q))?.param ?? null;
    expect(parse("day=2026-10-05")).toBe("2026-10-05");
    expect(parse("month=2026-09")).toBe("2026-09");
    expect(parse("year=2025")).toBe("2025");
    expect(parse("day=2026-02-30")).toBeNull(); // no such date
    expect(parse("day=2026-1-5")).toBeNull();
    expect(parse("year=25")).toBeNull();
    expect(parse("")).toBeNull();
  });
});

describe("UT-DASH: หน้าแดชบอร์ดผู้ดูแลระบบ", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
    window.history.replaceState(null, "", "/admin");
  });
  afterEach(() => vi.useRealTimers());

  // The timestamp only appears once every query has resolved
  const loaded = () => screen.findByText(/^ข้อมูล ณ/);
  const renderLoaded = async () => {
    render(<AdminDashboardPage />);
    await loaded();
  };

  const sample = [
    req(1, "2026-10-02T10:00:00+07:00", "สถานะแจ้งซ่อม", null),
    req(2, "2026-10-10T10:00:00+07:00", "สถานะเสร็จสมบรูณ์", 400),
    req(3, "2026-09-05T10:00:00+07:00", "สถานะเสร็จสมบรูณ์", 250),
  ];

  it("UT-DASH-07 แสดงภาพรวมงานซ่อมทั้งหมดเมื่อไม่ได้เลือกเดือน", async () => {
    seed(sample);
    render(<AdminDashboardPage />);
    await loaded();
    expect(screen.getByText("สถานะงานซ่อมทั้งหมด")).toBeTruthy();
    expect(screen.getByText("แจ้งซ่อมทั้งหมด").previousElementSibling!.textContent).toBe("3");
    const totalCost = screen.getAllByText("ค่าซ่อมสะสม").find((el) => el.tagName === "P")!; // the other is a table header
    expect(totalCost.previousElementSibling!.textContent).toBe("650 บาท");
  });

  it("UT-DASH-08 กรองแดชบอร์ดเป็นรายเดือน", async () => {
    seed(sample);
    const view = render(<AdminDashboardPage />);
    await loaded();
    fireEvent.change(screen.getByLabelText("ช่วงเวลา"), { target: { value: "month" } });
    fireEvent.change(screen.getByLabelText("เลือกเดือน"), { target: { value: String(monthKey(new Date(2026, 8, 1))) } });

    expect(screen.getByText("สถานะงานซ่อม ก.ย. 2569")).toBeTruthy();
    expect(screen.getByText("แจ้งซ่อมในช่วงนี้").previousElementSibling!.textContent).toBe("1");
    expect(screen.getByText("ค่าซ่อมในช่วงนี้").previousElementSibling!.textContent).toBe("250 บาท");
    expect(window.location.search).toBe("?month=2026-09");

    fireEvent.click(screen.getByRole("button", { name: /ล้างตัวกรอง/ }));
    expect(screen.getByText("สถานะงานซ่อมทั้งหมด")).toBeTruthy();
    expect(window.location.search).toBe("");
  });

  it("UT-DASH-09 เปิดลิงก์แดชบอร์ดที่ระบุเดือนไว้ใน URL", async () => {
    window.history.replaceState(null, "", "/admin?month=2026-10");
    seed(sample);
    render(<AdminDashboardPage />);
    await loaded();
    expect(screen.getByText("สถานะงานซ่อม ต.ค. 2569")).toBeTruthy();
    expect(screen.getByText("แจ้งซ่อมในช่วงนี้").previousElementSibling!.textContent).toBe("2");
  });

  it("UT-DASH-10 เปิดลิงก์ที่ระบุเดือนผิดรูปแบบหรือเป็นเดือนในอนาคต", async () => {
    window.history.replaceState(null, "", "/admin?month=2099-01");
    seed(sample);
    render(<AdminDashboardPage />);
    await loaded();
    expect(screen.getByText("สถานะงานซ่อมทั้งหมด")).toBeTruthy();
  });

  it("UT-DASH-11 แสดงแดชบอร์ดเมื่อยังไม่มีข้อมูลการแจ้งซ่อมเลย", async () => {
    seed([]);
    render(<AdminDashboardPage />);
    await loaded();
    expect(screen.getByText("ยังไม่มีการแจ้งซ่อม")).toBeTruthy();
    expect(screen.getByText("ไม่มีงานซ่อมค้าง")).toBeTruthy();
    expect(screen.getByText("ยังไม่มีข้อมูลการซ่อม")).toBeTruthy();
  });

  it("UT-DASH-12 เลือกเดือนที่ไม่มีการแจ้งซ่อม", async () => {
    seed(sample);
    const view = render(<AdminDashboardPage />);
    await loaded();
    fireEvent.change(screen.getByLabelText("ช่วงเวลา"), { target: { value: "month" } });
    fireEvent.change(screen.getByLabelText("เลือกเดือน"), { target: { value: String(monthKey(new Date(2026, 6, 1))) } });
    expect(screen.getByText("ไม่มีการแจ้งซ่อมใน ก.ค. 2569")).toBeTruthy();
    expect(screen.getByText("ไม่มีงานซ่อมค้างที่แจ้งใน ก.ค. 2569")).toBeTruthy();
  });
  it("UT-DASH-16 กรองแดชบอร์ดรายวัน", async () => {
    seed(sample);
    await renderLoaded();
    fireEvent.change(screen.getByLabelText("ช่วงเวลา"), { target: { value: "day" } });
    const dayInput = screen.getByLabelText("เลือกวันที่") as HTMLInputElement;
    expect(dayInput.value).toBe("2026-10-23"); // defaults to today
    fireEvent.change(dayInput, { target: { value: "2026-10-10" } });

    expect(screen.getByText("สถานะงานซ่อม 10 ต.ค. 2569")).toBeTruthy();
    expect(screen.getByText("แจ้งซ่อมในช่วงนี้").previousElementSibling!.textContent).toBe("1");
    expect(screen.getByText("ค่าซ่อมในช่วงนี้").previousElementSibling!.textContent).toBe("400 บาท");
    expect(screen.getByText("ค่าซ่อมเรียกเก็บจากผู้เช่า 10 ต.ค. 2569")).toBeTruthy();
    expect(screen.getByText(/จาก 9 ต.ค. 2569$/)).toBeTruthy();
    expect(window.location.search).toBe("?day=2026-10-10");
  });

  it("UT-DASH-17 กรองแดชบอร์ดรายปี", async () => {
    seed([...sample, req(4, "2025-03-01T10:00:00+07:00", "สถานะเสร็จสมบรูณ์", 100)]);
    await renderLoaded();
    fireEvent.change(screen.getByLabelText("ช่วงเวลา"), { target: { value: "year" } });
    expect(screen.getByText("แจ้งซ่อมในช่วงนี้").previousElementSibling!.textContent).toBe("3");
    expect(screen.getByText("แนวโน้มการแจ้งซ่อมรายเดือน ปี 2569")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("เลือกปี"), { target: { value: "2025" } });
    expect(screen.getByText("สถานะงานซ่อม ปี 2568")).toBeTruthy();
    expect(screen.getByText("แจ้งซ่อมในช่วงนี้").previousElementSibling!.textContent).toBe("1");
    expect(window.location.search).toBe("?year=2025");
  });

  it("UT-DASH-18 เปลี่ยนจากรายเดือนเป็นรายวันโดยคงเดือนที่เลือกไว้", async () => {
    window.history.replaceState(null, "", "/admin?month=2026-09");
    seed(sample);
    await renderLoaded();
    fireEvent.change(screen.getByLabelText("ช่วงเวลา"), { target: { value: "day" } });
    expect((screen.getByLabelText("เลือกวันที่") as HTMLInputElement).value).toBe("2026-09-01");
    expect(window.location.search).toBe("?day=2026-09-01");
  });

  it("UT-DASH-19 เปิดลิงก์ที่ระบุวันที่ในอนาคต", async () => {
    window.history.replaceState(null, "", "/admin?day=2026-12-25");
    seed(sample);
    await renderLoaded();
    expect(screen.getByText("สถานะงานซ่อมทั้งหมด")).toBeTruthy();
  });
});
