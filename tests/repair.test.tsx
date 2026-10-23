import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createSupabaseMock } from "./supabase-mock";

const { mock, router, params } = vi.hoisted(() => ({
  mock: {} as ReturnType<typeof import("./supabase-mock").createSupabaseMock>,
  router: { replace: vi.fn(), push: vi.fn() },
  params: { value: new URLSearchParams() },
}));

vi.mock("@/lib/supabase", () => ({ get supabase() { return mock.client; } }));
vi.mock("next/navigation", () => ({ useRouter: () => router, useSearchParams: () => params.value }));
vi.mock("@/components/ImageUpload", () => ({ ImageUpload: () => <div /> }));
vi.mock("@/components/AssetAvatar", () => ({ AssetAvatar: () => <div /> }));

import ReportDamagePage from "@/app/user/report/page";
import AdminRequestsPage from "@/app/admin/requests/page";

const roomAssets = [
  { asset_id: 1, room_id: 7, product_id: 11, product_name: "ตู้เย็น", product_image: null, status_name: "สถานะปกติ", date_add: null },
  { asset_id: 2, room_id: 7, product_id: 12, product_name: "แอร์", product_image: null, status_name: "สถานะปกติ", date_add: null },
];

const statuses = [
  { status_id: 1, status_name: "สถานะแจ้งซ่อม" },
  { status_id: 2, status_name: "สถานะกำลังดำเนินการ" },
  { status_id: 3, status_name: "สถานะเสร็จสมบรูณ์" },
];

const requestRow = (id: number, status: string, extra: Record<string, unknown> = {}) => ({
  maintenance_request_id: id,
  product_name: `ครุภัณฑ์ ${id}`,
  product_image: null,
  status,
  reported_date: "2026-10-20T03:00:00Z",
  description: `รายละเอียด ${id}`,
  image_path: null,
  repair_cost: null,
  room_number: "101",
  room_id: 7,
  ...extra,
});

const renderReport = async () => {
  const view = render(<ReportDamagePage />);
  await screen.findByText("-- เลือกครุภัณฑ์ที่เสียหาย --");
  const select = view.container.querySelector("select")!;
  const textarea = view.container.querySelector("textarea")!;
  const form = view.container.querySelector("form")!;
  return { select, textarea, form };
};

describe("UT-REP: การแจ้งซ่อม (ผู้เช่า)", () => {
  beforeEach(() => {
    Object.assign(mock, createSupabaseMock());
    params.value = new URLSearchParams();
    mock.setTable("view_room_asset", { data: roomAssets });
    mock.client.rpc.mockResolvedValue({ data: 7, error: null });
  });

  it("UT-REP-01 แจ้งซ่อมโดยเลือกครุภัณฑ์และกรอกรายละเอียดครบถ้วน", async () => {
    const requests = mock.setTable("maintenance_request", { error: null });
    const { select, textarea, form } = await renderReport();
    fireEvent.change(select, { target: { value: "12" } });
    fireEvent.change(textarea, { target: { value: "  แอร์ไม่เย็น มีน้ำหยด  " } });
    fireEvent.submit(form);

    expect(await screen.findByText("แจ้งซ่อมสำเร็จ")).toBeTruthy();
    expect(requests.insert).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 12, room_id: 7, description: "แอร์ไม่เย็น มีน้ำหยด", status: "สถานะแจ้งซ่อม", image_path: null })
    );
  });

  it("UT-REP-02 แจ้งซ่อมโดยไม่เลือกครุภัณฑ์", async () => {
    const requests = mock.setTable("maintenance_request", { error: null });
    const { textarea, form } = await renderReport();
    fireEvent.change(textarea, { target: { value: "เสีย" } });
    fireEvent.submit(form);
    await new Promise((r) => setTimeout(r, 20));
    expect(requests.insert).not.toHaveBeenCalled();
    expect(screen.queryByText("แจ้งซ่อมสำเร็จ")).toBeNull();
  });

  it("UT-REP-03 แจ้งซ่อมโดยกรอกรายละเอียดเป็นช่องว่างอย่างเดียว", async () => {
    const requests = mock.setTable("maintenance_request", { error: null });
    const { select, textarea, form } = await renderReport();
    fireEvent.change(select, { target: { value: "11" } });
    fireEvent.change(textarea, { target: { value: "     " } });
    fireEvent.submit(form);
    await new Promise((r) => setTimeout(r, 20));
    expect(requests.insert).not.toHaveBeenCalled();
  });

  it("UT-REP-04 บันทึกการแจ้งซ่อมไม่สำเร็จ (ฐานข้อมูลตอบกลับข้อผิดพลาด)", async () => {
    mock.setTable("maintenance_request", { error: { message: "new row violates row-level security policy" } });
    const { select, textarea, form } = await renderReport();
    fireEvent.change(select, { target: { value: "11" } });
    fireEvent.change(textarea, { target: { value: "ประตูตู้เย็นปิดไม่สนิท" } });
    fireEvent.submit(form);
    expect(await screen.findByText("new row violates row-level security policy")).toBeTruthy();
    expect(screen.queryByText("แจ้งซ่อมสำเร็จ")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("UT-REP-05 กดแจ้งปัญหาจากหน้าเช็คอุปกรณ์แล้วระบบเลือกครุภัณฑ์ให้อัตโนมัติ", async () => {
    params.value = new URLSearchParams("productId=12");
    const { select } = await renderReport();
    expect((select as HTMLSelectElement).value).toBe("12");
  });
});

describe("UT-REP: การจัดการงานซ่อม (ผู้ดูแลระบบ)", () => {
  beforeEach(() => {
    Object.assign(mock, createSupabaseMock());
    mock.setTable("status", { data: statuses });
  });

  it("UT-REP-06 เปลี่ยนสถานะงานซ่อมจาก \"แจ้งซ่อม\" เป็น \"กำลังดำเนินการ\"", async () => {
    mock.setTable("view_home_user", { data: [requestRow(5, "สถานะแจ้งซ่อม")] });
    const view = render(<AdminRequestsPage />);
    await screen.findByText("ครุภัณฑ์ 5");
    const updates = mock.setTable("maintenance_request", { error: null });
    const statusSelect = view.container.querySelectorAll("select")[1] as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "สถานะกำลังดำเนินการ" } });

    await waitFor(() => expect(updates.update).toHaveBeenCalledWith({ status: "สถานะกำลังดำเนินการ" }));
    expect(updates.eq).toHaveBeenCalledWith("maintenance_request_id", 5);
    await waitFor(() => expect(statusSelect.value).toBe("สถานะกำลังดำเนินการ"));
  });

  it("UT-REP-07 เปลี่ยนสถานะไม่สำเร็จ (ฐานข้อมูลตอบกลับข้อผิดพลาด)", async () => {
    mock.setTable("view_home_user", { data: [requestRow(5, "สถานะแจ้งซ่อม")] });
    const view = render(<AdminRequestsPage />);
    await screen.findByText("ครุภัณฑ์ 5");
    const updates = mock.setTable("maintenance_request", { error: { message: "permission denied" } });
    const statusSelect = view.container.querySelectorAll("select")[1] as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "สถานะเสร็จสมบรูณ์" } });

    await waitFor(() => expect(updates.update).toHaveBeenCalled());
    await waitFor(() => expect(statusSelect.disabled).toBe(false));
    expect(statusSelect.value).toBe("สถานะแจ้งซ่อม");
  });

  it("UT-REP-08 บันทึกค่าซ่อมที่เรียกเก็บจากผู้เช่า", async () => {
    mock.setTable("view_home_user", { data: [requestRow(5, "สถานะเสร็จสมบรูณ์")] });
    render(<AdminRequestsPage />);
    await screen.findByText("ครุภัณฑ์ 5");
    const updates = mock.setTable("maintenance_request", { error: null });
    const cost = screen.getByPlaceholderText("ค่าซ่อม (บาท)");
    fireEvent.change(cost, { target: { value: "350.50" } });
    fireEvent.blur(cost);

    await waitFor(() => expect(updates.update).toHaveBeenCalledWith({ repair_cost: 350.5 }));
    expect(await screen.findByText("ค่าซ่อม 350.5 บาท")).toBeTruthy();
  });

  it("UT-REP-09 ลบค่าซ่อมออก (เว้นช่องว่าง) ระบบบันทึกเป็นค่าว่าง", async () => {
    mock.setTable("view_home_user", { data: [requestRow(5, "สถานะเสร็จสมบรูณ์", { repair_cost: 200 })] });
    render(<AdminRequestsPage />);
    await screen.findByText("ครุภัณฑ์ 5");
    const updates = mock.setTable("maintenance_request", { error: null });
    const cost = screen.getByPlaceholderText("ค่าซ่อม (บาท)");
    fireEvent.change(cost, { target: { value: "" } });
    fireEvent.blur(cost);
    await waitFor(() => expect(updates.update).toHaveBeenCalledWith({ repair_cost: null }));
  });

  it("UT-REP-10 กรองรายการแจ้งซ่อมตามสถานะ", async () => {
    mock.setTable("view_home_user", {
      data: [requestRow(1, "สถานะแจ้งซ่อม"), requestRow(2, "สถานะเสร็จสมบรูณ์"), requestRow(3, "สถานะแจ้งซ่อม")],
    });
    const view = render(<AdminRequestsPage />);
    await screen.findByText("ครุภัณฑ์ 1");
    fireEvent.change(view.container.querySelector("select")!, { target: { value: "สถานะแจ้งซ่อม" } });
    expect(screen.getByText("ครุภัณฑ์ 1")).toBeTruthy();
    expect(screen.getByText("ครุภัณฑ์ 3")).toBeTruthy();
    expect(screen.queryByText("ครุภัณฑ์ 2")).toBeNull();
  });

  it("UT-REP-11 แสดงหน้ารายการแจ้งซ่อมเมื่อยังไม่มีข้อมูล", async () => {
    mock.setTable("view_home_user", { data: [] });
    render(<AdminRequestsPage />);
    expect(await screen.findByText("ไม่มีรายการแจ้งซ่อม")).toBeTruthy();
  });
});
