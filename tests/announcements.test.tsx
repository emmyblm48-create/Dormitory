import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createSupabaseMock } from "./supabase-mock";

const { mock } = vi.hoisted(() => ({
  mock: {} as ReturnType<typeof import("./supabase-mock").createSupabaseMock>,
}));

vi.mock("@/lib/supabase", () => ({ get supabase() { return mock.client; } }));
vi.mock("@/components/ImageUpload", () => ({ ImageUpload: () => <div /> }));

import AdminAnnouncementsPage from "@/app/admin/announcements/page";

const fields = (container: HTMLElement) => ({
  title: container.querySelector("form input:not([type])") as HTMLInputElement,
  content: container.querySelector("form textarea") as HTMLTextAreaElement,
  form: container.querySelector("form") as HTMLFormElement,
});

describe("UT-ANN: ข่าวสารประชาสัมพันธ์", () => {
  beforeEach(() => {
    Object.assign(mock, createSupabaseMock());
  });

  it("UT-ANN-01 เพิ่มข่าวประชาสัมพันธ์ใหม่พร้อมปักหมุด", async () => {
    const view = render(<AdminAnnouncementsPage />);
    expect(await screen.findByText("ยังไม่มีข่าวประชาสัมพันธ์")).toBeTruthy();
    const table = mock.setTable("announcements", { data: [], error: null });
    const { title, content, form } = fields(view.container);
    fireEvent.change(title, { target: { value: " งดจ่ายน้ำ " } });
    fireEvent.change(content, { target: { value: "วันเสาร์นี้ 9:00-12:00 น." } });
    fireEvent.click(screen.getByLabelText("ปักหมุดข่าวนี้ไว้บนสุด"));
    fireEvent.submit(form);
    await waitFor(() =>
      expect(table.insert).toHaveBeenCalledWith(
        expect.objectContaining({ title: "งดจ่ายน้ำ", content: "วันเสาร์นี้ 9:00-12:00 น.", category: "ข่าวสารทั่วไป", is_pinned: true })
      )
    );
  });

  it("UT-ANN-02 เพิ่มข่าวโดยเว้นว่างหัวข้อ", async () => {
    const view = render(<AdminAnnouncementsPage />);
    await screen.findByText("ยังไม่มีข่าวประชาสัมพันธ์");
    const table = mock.setTable("announcements", { data: [], error: null });
    const { content, form } = fields(view.container);
    fireEvent.change(content, { target: { value: "เนื้อหา" } });
    fireEvent.submit(form);
    await new Promise((r) => setTimeout(r, 20));
    expect(table.insert).not.toHaveBeenCalled();
  });

  it("UT-ANN-03 บันทึกข่าวไม่สำเร็จ (ฐานข้อมูลตอบกลับข้อผิดพลาด)", async () => {
    const view = render(<AdminAnnouncementsPage />);
    await screen.findByText("ยังไม่มีข่าวประชาสัมพันธ์");
    mock.setTable("announcements", { data: [], error: { message: "value too long for type character varying(100)" } });
    const { title, content, form } = fields(view.container);
    fireEvent.change(title, { target: { value: "ประกาศ" } });
    fireEvent.change(content, { target: { value: "เนื้อหา" } });
    fireEvent.submit(form);
    expect(await screen.findByText("value too long for type character varying(100)")).toBeTruthy();
  });

  it("UT-ANN-04 แก้ไขข่าวที่มีอยู่", async () => {
    mock.setTable("announcements", {
      data: [{ announcement_id: 9, title: "ข่าวเดิม", content: "เนื้อหาเดิม", category: "ประกาศ", image_path: null, is_pinned: false, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" }],
    });
    const view = render(<AdminAnnouncementsPage />);
    await screen.findByText("ข่าวเดิม");
    const table = mock.setTable("announcements", { data: [], error: null });
    const editButton = view.container.querySelectorAll("button")[1]; // [0] submit, [1] edit on the first row
    fireEvent.click(editButton);
    const { title, form } = fields(view.container);
    expect(title.value).toBe("ข่าวเดิม");
    fireEvent.change(title, { target: { value: "ข่าวใหม่" } });
    fireEvent.submit(form);
    await waitFor(() => expect(table.update).toHaveBeenCalledWith(expect.objectContaining({ title: "ข่าวใหม่", category: "ประกาศ" })));
    expect(table.eq).toHaveBeenCalledWith("announcement_id", 9);
  });
});
