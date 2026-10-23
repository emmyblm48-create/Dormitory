import { vi } from "vitest";

type Result = { data?: unknown; error?: { message: string } | null };

// Chainable stand-in for a supabase-js query: every builder method returns itself,
// and awaiting it resolves to `result`.
export const createQuery = (result: Result = { data: [], error: null }) => {
  const resolved = { data: result.data ?? null, error: result.error ?? null };
  const q: Record<string, unknown> = {};
  for (const m of ["select", "order", "eq", "ilike", "insert", "update", "delete", "limit", "in"]) {
    q[m] = vi.fn(() => q);
  }
  q.maybeSingle = vi.fn(() => Promise.resolve(resolved));
  q.single = vi.fn(() => Promise.resolve(resolved));
  q.then = (onOk: (v: unknown) => unknown, onErr?: (e: unknown) => unknown) => Promise.resolve(resolved).then(onOk, onErr);
  return q as Record<string, ReturnType<typeof vi.fn>> & PromiseLike<typeof resolved>;
};

export type MockQuery = ReturnType<typeof createQuery>;

// Loosely typed mock so tests can feed any resolved value
const anyFn = (impl: (...args: any[]) => any = () => undefined) => vi.fn<(...args: any[]) => any>(impl);

// Fake client whose `from(table)` hands out the query registered for that table
export const createSupabaseMock = () => {
  const tables = new Map<string, MockQuery>();
  const client = {
    from: vi.fn((table: string) => {
      if (!tables.has(table)) tables.set(table, createQuery());
      return tables.get(table)!;
    }),
    rpc: anyFn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      signInWithPassword: anyFn(() => Promise.resolve({ data: {}, error: null })),
      signOut: anyFn(() => Promise.resolve({ error: null })),
      getSession: anyFn(() => Promise.resolve({ data: { session: null } })),
      getUser: anyFn(() => Promise.resolve({ data: { user: null } })),
      onAuthStateChange: anyFn(() => ({ data: { subscription: { unsubscribe: anyFn() } } })),
      admin: {
        createUser: anyFn(),
        deleteUser: anyFn(() => Promise.resolve({ error: null })),
        listUsers: anyFn(),
        updateUserById: anyFn(() => Promise.resolve({ error: null })),
      },
    },
    storage: { from: vi.fn() },
  };
  const setTable = (table: string, result: Result) => {
    const q = createQuery(result);
    tables.set(table, q);
    return q;
  };
  const reset = () => tables.clear();
  return { client, setTable, reset };
};
