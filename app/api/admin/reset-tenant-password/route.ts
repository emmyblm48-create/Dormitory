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
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "กรุณาระบุอีเมลและรหัสผ่านใหม่" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();

  let authUserId: string | null = null;
  let page = 1;
  const perPage = 200;
  while (!authUserId) {
    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 });
    }
    const match = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      authUserId = match.id;
      break;
    }
    if (listData.users.length < perPage) break;
    page += 1;
  }

  if (!authUserId) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้นี้" }, { status: 404 });
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, { password });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
