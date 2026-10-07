"use client";

import { CrudTable } from "@/components/admin/CrudTable";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
      <h2 className="sr-only">จัดการหมวดหมู่และสถานะ</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CrudTable
          title="หมวดหมู่ครุภัณฑ์"
          table="categories"
          idField="category_id"
          columns={[{ key: "category_name", label: "ชื่อหมวดหมู่" }]}
        />
        <CrudTable
          title="สถานะ"
          table="status"
          idField="status_id"
          columns={[{ key: "status_name", label: "ชื่อสถานะ" }]}
          note="ชื่อสถานะหลัก (ปกติ, กำลังดำเนินการ, เสร็จสมบรูณ์, แจ้งซ่อม) ใช้กำหนดสีในระบบ ถ้าเปลี่ยนชื่อ สีของสถานะนั้นจะไม่แสดง"
        />
      </div>
    </div>
  );
}
