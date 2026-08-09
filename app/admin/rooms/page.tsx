"use client";

import { CrudTable } from "@/components/admin/CrudTable";

export default function AdminRoomsPage() {
  return (
    <CrudTable
      title="จัดการห้องพัก"
      table="rooms"
      idField="room_id"
      columns={[
        { key: "room_number", label: "เลขห้อง" },
        { key: "floor", label: "ชั้น" },
        { key: "rent_price", label: "ค่าห้อง/เดือน", type: "number" },
      ]}
    />
  );
}
