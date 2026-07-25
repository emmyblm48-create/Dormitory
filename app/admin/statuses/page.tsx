"use client";

import { CrudTable } from "@/components/admin/CrudTable";

export default function AdminStatusesPage() {
  return (
    <CrudTable
      title="จัดการสถานะ"
      table="status"
      idField="status_id"
      columns={[{ key: "status_name", label: "ชื่อสถานะ" }]}
    />
  );
}
