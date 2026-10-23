// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "./supabase-mock";

const { caller, admin } = vi.hoisted(() => ({
  caller: {} as ReturnType<typeof import("./supabase-mock").createSupabaseMock>,
  admin: {} as ReturnType<typeof import("./supabase-mock").createSupabaseMock>,
}));

vi.mock("@/lib/supabase-admin", () => ({
  createCallerClient: () => caller.client,
  createServiceRoleClient: () => admin.client,
}));

import { POST as createTenant } from "@/app/api/admin/create-tenant/route";
import { POST as deleteTenant } from "@/app/api/admin/delete-tenant/route";
import { POST as resetPassword } from "@/app/api/admin/reset-tenant-password/route";
import { generatePassword } from "@/lib/tenant-admin";

const request = (body: unknown, token: string | null = "admin-token") =>
  new NextRequest("http://localhost/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

const asRole = (role: string | null) => caller.client.rpc.mockResolvedValue({ data: role, error: null });

describe("UT-AUTH: การจัดการบัญชีผู้ใช้ (API ผู้ดูแลระบบ)", () => {
  beforeEach(() => {
    Object.assign(caller, createSupabaseMock());
    Object.assign(admin, createSupabaseMock());
    asRole("admin");
    admin.client.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
    admin.client.auth.admin.listUsers.mockResolvedValue({
      data: { users: [{ id: "u-1", email: "room101@dorm.com" }] },
      error: null,
    });
  });

  it("UT-AUTH-06 สร้างบัญชีผู้เช่าด้วยข้อมูลครบถ้วน", async () => {
    const profiles = admin.setTable("user_extra", { error: null });
    const res = await createTenant(request({ email: "room101@dorm.com", password: "abc123", userName: "101" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, userId: "u-1" });
    expect(admin.client.auth.admin.createUser).toHaveBeenCalledWith({ email: "room101@dorm.com", password: "abc123", email_confirm: true });
    expect(profiles.insert).toHaveBeenCalledWith({ email: "room101@dorm.com", userName: "101", role: "user" });
  });

  it("UT-AUTH-07 สร้างบัญชีโดยเว้นว่างฟิลด์บังคับ", async () => {
    const res = await createTenant(request({ email: "room101@dorm.com", password: "", userName: "" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("กรุณากรอกข้อมูลให้ครบถ้วน");
    expect(admin.client.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("UT-AUTH-08 สร้างบัญชีด้วยรหัสผ่านสั้นกว่า 6 ตัวอักษร", async () => {
    const res = await createTenant(request({ email: "room101@dorm.com", password: "123", userName: "101" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
  });

  it("UT-AUTH-09 เรียก API โดยไม่ได้เข้าสู่ระบบ (ไม่มี Token)", async () => {
    const res = await createTenant(request({ email: "x@dorm.com", password: "abc123", userName: "x" }, null));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("ไม่ได้เข้าสู่ระบบ");
  });

  it("UT-AUTH-10 ผู้เช่าพยายามเรียก API ของผู้ดูแลระบบ", async () => {
    asRole("user");
    const res = await createTenant(request({ email: "x@dorm.com", password: "abc123", userName: "x" }, "tenant-token"));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("ไม่มีสิทธิ์ดำเนินการนี้");
    expect(admin.client.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("UT-AUTH-11 ส่งค่า role อื่นที่ไม่ใช่ admin มาตอนสร้างบัญชี", async () => {
    const profiles = admin.setTable("user_extra", { error: null });
    await createTenant(request({ email: "x@dorm.com", password: "abc123", userName: "x", role: "superuser" }));
    expect(profiles.insert).toHaveBeenCalledWith(expect.objectContaining({ role: "user" }));
  });

  it("UT-AUTH-12 บันทึกข้อมูลโปรไฟล์ไม่สำเร็จหลังสร้างบัญชี", async () => {
    admin.setTable("user_extra", { error: { message: "duplicate key value" } });
    const res = await createTenant(request({ email: "room101@dorm.com", password: "abc123", userName: "101" }));
    expect(res.status).toBe(400);
    expect(admin.client.auth.admin.deleteUser).toHaveBeenCalledWith("u-1");
  });

  it("UT-AUTH-13 ผู้ดูแลระบบลบบัญชีของตัวเอง", async () => {
    caller.client.auth.getUser.mockResolvedValue({ data: { user: { email: "Admin@dorm.com" } } });
    const res = await deleteTenant(request({ email: "admin@dorm.com" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("ไม่สามารถลบบัญชีของตัวเองได้");
    expect(admin.client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("UT-AUTH-14 ลบบัญชีผู้เช่า", async () => {
    caller.client.auth.getUser.mockResolvedValue({ data: { user: { email: "admin@dorm.com" } } });
    const profiles = admin.setTable("user_extra", { error: null });
    const res = await deleteTenant(request({ email: "ROOM101@dorm.com" }));
    expect(res.status).toBe(200);
    expect(admin.client.auth.admin.deleteUser).toHaveBeenCalledWith("u-1");
    expect(profiles.delete).toHaveBeenCalled();
    expect(profiles.eq).toHaveBeenCalledWith("email", "ROOM101@dorm.com");
  });

  it("UT-AUTH-15 รีเซ็ตรหัสผ่านให้ผู้เช่า", async () => {
    const res = await resetPassword(request({ email: "room101@dorm.com", password: "newpass1" }));
    expect(res.status).toBe(200);
    expect(admin.client.auth.admin.updateUserById).toHaveBeenCalledWith("u-1", { password: "newpass1" });
  });

  it("UT-AUTH-16 รีเซ็ตรหัสผ่านของอีเมลที่ไม่มีในระบบ", async () => {
    const res = await resetPassword(request({ email: "nobody@dorm.com", password: "newpass1" }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("ไม่พบบัญชีผู้ใช้นี้");
    expect(admin.client.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("UT-AUTH-17 สุ่มรหัสผ่านเริ่มต้นสำหรับผู้เช่า", () => {
    const passwords = Array.from({ length: 50 }, () => generatePassword());
    for (const p of passwords) {
      expect(p).toHaveLength(8);
      expect(p).toMatch(/^[a-km-np-zA-HJ-NP-Z2-9]+$/); // no look-alike characters 0 O 1 l I
    }
    expect(new Set(passwords).size).toBe(passwords.length);
    expect(generatePassword(12)).toHaveLength(12);
  });
});
