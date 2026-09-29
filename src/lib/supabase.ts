const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

const _nativeFetch = fetch;

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await _nativeFetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries exceeded");
}

function baseHeaders() {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

function buildFilterString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val === null) {
      params.set(key, 'is.null');
    } else if (typeof val === 'object' && val.__op) {
      params.set(key, `${val.__op}.${val.value}`);
    } else {
      params.set(key, `eq.${val}`);
    }
  }
  return params.toString();
}

export function from(table: string) {
  return {
    async select(cols = '*', opts?: { count?: string; head?: boolean }) {
      const params = new URLSearchParams();
      params.set('select', cols);
      if (opts?.count) params.set('count', opts.count);
      if (opts?.head) params.set('head', 'true');
      return { params, _table: table, _method: 'GET' as const };
    },

    async insert(rows: any) {
      const res = await fetchWithRetry(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify(rows),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.message || json.hint || 'Insert failed', code: res.status } };
      return { data: json, error: null };
    },

    async upsert(rows: any) {
      const h = baseHeaders();
      h.Prefer = 'return=representation,resolution=merge-duplicates';
      const res = await fetchWithRetry(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(rows),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.message || 'Upsert failed', code: res.status } };
      return { data: json, error: null };
    },

    async update(data: any, filters: Record<string, any>) {
      const qs = buildFilterString(filters);
      const url = `${supabaseUrl}/rest/v1/${table}?${qs}`;
      const res = await fetchWithRetry(url, {
        method: 'PATCH',
        headers: baseHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.message || 'Update failed', code: res.status } };
      return { data: json, error: null };
    },

    async delete(filters: Record<string, any>) {
      const qs = buildFilterString(filters);
      const url = `${supabaseUrl}/rest/v1/${table}?${qs}`;
      const res = await fetchWithRetry(url, {
        method: 'DELETE',
        headers: baseHeaders(),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { error: { message: json.message || 'Delete failed', code: res.status } };
      }
      return { error: null };
    },

    async rpc(fn: string, params?: Record<string, any>) {
      const res = await fetchWithRetry(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify(params || {}),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.message || 'RPC failed', code: res.status } };
      return { data: json, error: null };
    },
  };
}

// Query builder for chained select queries
export async function query(
  table: string,
  opts: {
    select?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    range?: [number, number];
    single?: boolean;
    count?: string;
    head?: boolean;
  } = {},
): Promise<{ data: any; error: any; count?: number }> {
  const params = new URLSearchParams();
  const select = opts.select || '*';
  params.set('select', select);

  if (opts.filters) {
    for (const [key, val] of Object.entries(opts.filters)) {
      if (val === null) {
        params.set(key, 'is.null');
      } else if (typeof val === 'object' && val.__op) {
        params.set(key, `${val.__op}.${val.value}`);
      } else {
        params.set(key, `eq.${val}`);
      }
    }
  }

  if (opts.order) {
    params.set('order', `${opts.order.column}.${opts.order.ascending !== false ? 'asc' : 'desc'}`);
  }

  if (opts.limit) {
    params.set('limit', String(opts.limit));
  }

  let url = `${supabaseUrl}/rest/v1/${table}`;
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  const h = baseHeaders();
  const preferParts: string[] = [];
  if (opts.count) {
    preferParts.push(`count=${opts.count}`);
  }
  if (opts.head) {
    preferParts.push("return=minimal");
  }
  if (preferParts.length > 0) {
    h.Prefer = preferParts.join(", ");
  }
  if (opts.range) {
    (h as any).Range = `${opts.range[0]}-${opts.range[1]}`;
  }

  try {
    const res = await fetchWithRetry(url, { headers: h });
    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: { message: json.message || json.hint || 'Query failed', code: res.status } };
    }

    if (opts.single) {
      const row = Array.isArray(json) ? json[0] : json;
      return { data: row || null, error: null };
    }

    const countHeader = res.headers.get('content-range');
    const count = countHeader ? parseInt(countHeader.split('/')[1]) : undefined;

    return { data: json, error: null, count };
  } catch (error) {
    return { data: null, error: { message: (error as Error).message } };
  }
}

async function rpc(fn: string, params?: Record<string, any>) {
  const res = await fetchWithRetry(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: baseHeaders(),
    body: JSON.stringify(params || {}),
  });
  const json = await res.json();
  if (!res.ok) return { data: null, error: { message: json.message || 'RPC failed', code: res.status } };
  return { data: json, error: null };
}

export const supabase = { from, query, rpc };
