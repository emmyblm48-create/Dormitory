"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Loader2, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface CrudColumn {
  key: string;
  label: string;
  type?: "text" | "number";
}

interface CrudTableProps {
  title: string;
  table: string;
  idField: string;
  columns: CrudColumn[];
}

type Row = Record<string, any>;

export function CrudTable({ title, table, idField, columns }: CrudTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editValues, setEditValues] = useState<Row>({});
  const [newValues, setNewValues] = useState<Row>(
    Object.fromEntries(columns.map((c) => [c.key, ""]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from(table).select("*").order(idField, { ascending: false });
    if (!error && data) setRows(data);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const handleAdd = async () => {
    setError(null);
    const hasValue = columns.some((c) => String(newValues[c.key] ?? "").trim() !== "");
    if (!hasValue) return;
    setIsSaving(true);
    const { error } = await supabase.from(table).insert(newValues);
    setIsSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewValues(Object.fromEntries(columns.map((c) => [c.key, ""])));
    load();
  };

  const startEdit = (row: Row) => {
    setEditingId(row[idField]);
    setEditValues(row);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    setError(null);
    setIsSaving(true);
    const patch = Object.fromEntries(columns.map((c) => [c.key, editValues[c.key]]));
    const { error } = await supabase.from(table).update(patch).eq(idField, editingId);
    setIsSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    cancelEdit();
    load();
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("ยืนยันการลบข้อมูลนี้?")) return;
    setError(null);
    const { error } = await supabase.from(table).delete().eq(idField, id);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg md:text-xl font-bold text-slate-900">{title}</h2>

      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200/60 text-red-600 text-sm rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {/* Add form */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-end">
        {columns.map((c) => (
          <div key={c.key} className="flex-1">
            <label className="text-xs font-medium text-slate-500 mb-1 block">{c.label}</label>
            <input
              type={c.type === "number" ? "number" : "text"}
              step={c.type === "number" ? "0.01" : undefined}
              value={newValues[c.key] ?? ""}
              onChange={(e) => setNewValues((v) => ({ ...v, [c.key]: e.target.value }))}
              className="glass-input px-3 py-2 rounded-lg text-sm"
            />
          </div>
        ))}
        <button
          onClick={handleAdd}
          disabled={isSaving}
          className="btn-primary px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus size={16} /> เพิ่ม
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-brand-400" size={24} />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm glass-card rounded-2xl">
          ไม่มีข้อมูล
        </div>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-white/50 overflow-hidden">
          {rows.map((row) => {
            const isEditing = editingId === row[idField];
            return (
              <div key={row[idField]} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  {columns.map((c) => (
                    <div key={c.key}>
                      {isEditing ? (
                        <input
                          type={c.type === "number" ? "number" : "text"}
                          step={c.type === "number" ? "0.01" : undefined}
                          value={editValues[c.key] ?? ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, [c.key]: e.target.value }))}
                          className="glass-input px-2.5 py-1.5 rounded-lg text-sm"
                        />
                      ) : (
                        <span className="text-sm text-slate-800">{String(row[c.key] ?? "-")}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <button onClick={saveEdit} disabled={isSaving} className="p-2 rounded-lg bg-emerald-100/70 text-emerald-600 hover:bg-emerald-100">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEdit} className="p-2 rounded-lg bg-white/60 text-slate-500 hover:bg-white/90">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(row)} className="p-2 rounded-lg bg-brand-100/70 text-brand-600 hover:bg-brand-100">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(row[idField])} className="p-2 rounded-lg bg-red-100/70 text-red-500 hover:bg-red-100">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
