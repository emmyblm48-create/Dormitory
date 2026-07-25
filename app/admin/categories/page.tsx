"use client";

import { CrudTable } from "@/components/admin/CrudTable";

export default function AdminCategoriesPage() {
  return (
    <CrudTable
      title="จัดการหมวดหมู่ครุภัณฑ์"
      table="categories"
      idField="category_id"
      columns={[{ key: "category_name", label: "ชื่อหมวดหมู่" }]}
    />
  );
}
