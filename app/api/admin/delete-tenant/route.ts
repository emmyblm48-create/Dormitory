import { NextRequest, NextResponse } from "next/server";
import { createCallerClient, createServiceRoleClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }

  const callerClient = createCallerClient(accessToken);
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  const { data: role, error: roleError } = await callerClient.rpc("get_user_role");
  if (roleError || role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
  }

  const body = await req.json();
  const { email } = body as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "กรุณาระบุอีเมล" }, { status: 400 });
  }
  if (caller?.email?.toLowerCase() === email.toLowerCase()) {
    return NextResponse.json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" }, { status: 400 });
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

  if (authUserId) {
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(authUserId);
    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
    }
  }

  const { error: deleteProfileError } = await adminClient.from("user_extra").delete().eq("email", email);
  if (deleteProfileError) {
    return NextResponse.json({ error: deleteProfileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
