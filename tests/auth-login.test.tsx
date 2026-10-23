import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createSupabaseMock } from "./supabase-mock";

const { mock, auth, router } = vi.hoisted(() => ({
  mock: {} as ReturnType<typeof import("./supabase-mock").createSupabaseMock>,
  auth: { session: null as unknown, profile: null as unknown, isLoading: false },
  router: { replace: vi.fn(), push: vi.fn() },
}));

vi.mock("@/lib/supabase", () => ({ get supabase() { return mock.client; } }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => auth }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/components/SplashScreen", () => ({ SplashScreen: () => <div>splash</div> }));

import LoginPage from "@/app/page";

const fillAndSubmit = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
};

describe("UT-AUTH: การเข้าสู่ระบบ", () => {
  beforeEach(() => {
    Object.assign(mock, createSupabaseMock());
    Object.assign(auth, { session: null, profile: null, isLoading: false });
  });

  it("UT-AUTH-01 เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ถูกต้อง", async () => {
    render(<LoginPage />);
    fillAndSubmit("room101@dorm.com", "secret123");
    await waitFor(() =>
      expect(mock.client.auth.signInWithPassword).toHaveBeenCalledWith({ email: "room101@dorm.com", password: "secret123" })
    );
    expect(screen.queryByText(/เข้าสู่ระบบไม่สำเร็จ/)).toBeNull();
  });

  it("UT-AUTH-02 เข้าสู่ระบบด้วยรหัสผ่านที่ไม่ถูกต้อง", async () => {
    mock.client.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: "Invalid login credentials" } });
    render(<LoginPage />);
    fillAndSubmit("room101@dorm.com", "wrong");
    expect(await screen.findByText("เข้าสู่ระบบไม่สำเร็จ: Invalid login credentials")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("UT-AUTH-03 ผู้ดูแลระบบถูกพาไปหน้า /admin หลังเข้าสู่ระบบ", () => {
    Object.assign(auth, { session: { user: { email: "admin@dorm.com" } }, profile: { role: "admin" } });
    render(<LoginPage />);
    expect(router.replace).toHaveBeenCalledWith("/admin");
  });

  it("UT-AUTH-04 ผู้เช่าถูกพาไปหน้า /user หลังเข้าสู่ระบบ", () => {
    Object.assign(auth, { session: { user: { email: "room101@dorm.com" } }, profile: { role: "user" } });
    render(<LoginPage />);
    expect(router.replace).toHaveBeenCalledWith("/user");
  });

  it("UT-AUTH-05 บัญชีที่ไม่มีข้อมูลผู้ใช้ในระบบ", () => {
    Object.assign(auth, { session: { user: { email: "ghost@dorm.com" } }, profile: null });
    render(<LoginPage />);
    expect(screen.getByText("ไม่พบข้อมูลผู้ใช้สำหรับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ออกจากระบบ" }));
    expect(mock.client.auth.signOut).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
