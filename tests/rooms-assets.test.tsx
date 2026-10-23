import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createSupabaseMock } from "./supabase-mock";

const { mock } = vi.hoisted(() => ({
  mock: {} as ReturnType<typeof import("./supabase-mock").createSupabaseMock>,
}));

vi.mock("@/lib/supabase", () => ({ get supabase() { return mock.client; } }));
vi.mock("@/components/ImageUpload", () => ({ ImageUpload: () => <div /> }));
vi.mock("@/components/AssetAvatar", () => ({ AssetAvatar: () => <div /> }));

import { assignProductsToRoom, sameRoom } from "@/lib/tenant-admin";
import { computeOccupancy } from "@/lib/dashboard";
import { readChecked, storageKey } from "@/lib/checklist";
import AdminProductsPage from "@/app/admin/products/page";
import type { Room } from "@/lib/types";

const statuses = [
  { status_id: 1, status_name: "สถานะแจ้งซ่อม" },
  { status_id: 4, status_name: "สถานะปกติ" },
];

const room = (room_id: number, room_number: string, rent_price: number): Room => ({ room_id, room_number, floor: "1", rent_price });

describe("UT-ROOM: การจัดการห้องพักและครุภัณฑ์", () => {
  beforeEach(() => {
    Object.assign(mock, createSupabaseMock());
  });

  it("UT-ROOM-01 เพิ่มครุภัณฑ์เข้าห้องพัก", async () => {
    const assets = mock.setTable("room_asset", { error: null });
    const result = await assignProductsToRoom(7, [11, 12], statuses);
    expect(result).toEqual({ added: 2, error: null });
    const today = new Date().toISOString().slice(0, 10);
    expect(assets.insert).toHaveBeenCalledWith([
      { product_id: 11, room_id: 7, status_id: 4, date_add: today },
      { product_id: 12, room_id: 7, status_id: 4, date_add: today },
    ]);
  });

  it("UT-ROOM-02 เพิ่มครุภัณฑ์เข้าห้องโดยไม่ได้เลือกรายการใดเลย", async () => {
    const result = await assignProductsToRoom(7, [], statuses);
    expect(result).toEqual({ added: 0, error: null });
    expect(mock.client.from).not.toHaveBeenCalled();
  });

  it("UT-ROOM-03 เพิ่มครุภัณฑ์เข้าห้องไม่สำเร็จ (ฐานข้อมูลตอบกลับข้อผิดพลาด)", async () => {
    mock.setTable("room_asset", { error: { message: "violates foreign key constraint" } });
    const result = await assignProductsToRoom(7, [99], statuses);
    expect(result).toEqual({ added: 0, error: "violates foreign key constraint" });
  });

  it("UT-ROOM-04 จับคู่บัญชีผู้เช่ากับเลขห้องโดยไม่สนตัวพิมพ์และช่องว่าง", () => {
    expect(sameRoom(" A101 ", "a101")).toBe(true);
    expect(sameRoom("101", "102")).toBe(false);
    expect(sameRoom(null, "101")).toBe(false);
    expect(sameRoom(undefined, null)).toBe(true);
  });

  it("UT-ROOM-05 คำนวณอัตราการเข้าพักและรายได้ค่าเช่าที่คาดการณ์", () => {
    const rooms = [room(1, "101", 3000), room(2, "102", 3500), room(3, "103", 4000), room(4, "สำนักงาน", 0)];
    const tenants = [{ userName: "101", email: "a@dorm.com" }, { userName: "103", email: "c@dorm.com" }];
    const o = computeOccupancy(rooms, tenants);
    expect(o.rentable).toHaveLength(3); // the office has no rent, so it isn't counted
    expect(o.occupied.map((r) => r.room_number)).toEqual(["101", "103"]);
    expect(o.vacant.map((r) => r.room_number)).toEqual(["102"]);
    expect(o.percent).toBeCloseTo(66.67, 1);
    expect(o.expectedRent).toBe(7000);
    expect(o.vacancyLoss).toBe(3500);
  });

  it("UT-ROOM-06 คำนวณอัตราการเข้าพักเมื่อยังไม่มีห้องพักในระบบ", () => {
    const o = computeOccupancy([], []);
    expect(o.percent).toBe(0);
    expect(o.expectedRent).toBe(0);
  });

  it("UT-ROOM-07 จดจำรายการที่เช็คอุปกรณ์แล้วของแต่ละห้อง", () => {
    localStorage.setItem(storageKey(7), JSON.stringify([1, 3]));
    expect(Array.from(readChecked(7))).toEqual([1, 3]);
    expect(readChecked(8).size).toBe(0);
  });

  it("UT-ROOM-08 ข้อมูลเช็คลิสต์ในเครื่องเสียหาย (ไม่ใช่ JSON)", () => {
    localStorage.setItem(storageKey(7), "{not json");
    expect(() => readChecked(7)).not.toThrow();
    expect(readChecked(7).size).toBe(0);
  });

  it("UT-ROOM-09 เพิ่มครุภัณฑ์ใหม่เข้าสู่ระบบ", async () => {
    mock.setTable("products", { data: [] });
    const view = render(<AdminProductsPage />);
    await waitFor(() => expect(mock.client.from).toHaveBeenCalledWith("categories"));
    const products = mock.setTable("products", { data: [], error: null });
    fireEvent.change(screen.getByPlaceholderText("เช่น ตู้เย็น"), { target: { value: "  พัดลม  " } });
    fireEvent.submit(view.container.querySelector("form")!);
    expect(await screen.findByText('เพิ่ม "พัดลม" เข้าสู่ระบบแล้ว')).toBeTruthy();
    expect(products.insert).toHaveBeenCalledWith(expect.objectContaining({ product_name: "พัดลม", room_id: null, status_id: null }));
  });

  it("UT-ROOM-10 เพิ่มครุภัณฑ์ชื่อซ้ำกับที่มีอยู่แล้ว", async () => {
    mock.setTable("products", {
      data: [{ product_id: 1, product_name: "ตู้เย็น", product_image: null, date_recieved: null, room_id: null, category_id: null, status_id: null }],
    });
    const view = render(<AdminProductsPage />);
    await screen.findAllByText("ตู้เย็น");
    const products = mock.setTable("products", { data: [], error: null });
    fireEvent.change(screen.getByPlaceholderText("เช่น ตู้เย็น"), { target: { value: "ตู้เย็น " } });
    fireEvent.submit(view.container.querySelector("form")!);
    expect(await screen.findByText('มี "ตู้เย็น" ในระบบอยู่แล้ว')).toBeTruthy();
    expect(products.insert).not.toHaveBeenCalled();
  });

  it("UT-ROOM-11 เพิ่มครุภัณฑ์โดยเว้นว่างชื่อ", async () => {
    const view = render(<AdminProductsPage />);
    await waitFor(() => expect(mock.client.from).toHaveBeenCalledWith("categories"));
    const products = mock.setTable("products", { data: [], error: null });
    fireEvent.change(screen.getByPlaceholderText("เช่น ตู้เย็น"), { target: { value: "   " } });
    fireEvent.submit(view.container.querySelector("form")!);
    await new Promise((r) => setTimeout(r, 20));
    expect(products.insert).not.toHaveBeenCalled();
  });
});
