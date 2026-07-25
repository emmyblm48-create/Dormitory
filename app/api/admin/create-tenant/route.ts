import { NextRequest, NextResponse } from "next/server";
import { createCallerClient, createServiceRoleClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }

  const callerClient = createCallerClient(accessToken);
  const { data: role, error: roleError } = await callerClient.rpc("get_user_role");
  if (roleError || role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
  }

  const body = await req.json();
  const { email, password, userName, role: newRole } = body as {
    email?: string;
    password?: string;
    userName?: string;
    role?: string;
  };

  if (!email || !password || !userName) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || "สร้างบัญชีไม่สำเร็จ" }, { status: 400 });
  }

  const { error: profileError } = await adminClient.from("user_extra").insert({
    email,
    userName,
    role: newRole === "admin" ? "admin" : "user",
  });
  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile
    await adminClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: created.user.id });
}
