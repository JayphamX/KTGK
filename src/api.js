// Gọi MockAPI qua REST
import { BASE_URL, TABLE_CATEGORY, TABLE_DISH } from './config';

const TIMEOUT_MS = 8000;

async function request(method, path, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // MockAPI trả 404 khi resource chưa có bản ghi nào -> coi như danh sách rỗng
  list: async (table) => {
    try {
      return await request('GET', table);
    } catch (e) {
      if (e.status === 404) return [];
      throw e;
    }
  },
  create: (table, data) => request('POST', table, data),
  update: (table, id, data) => request('PUT', `${table}/${id}`, data),
  remove: (table, id) => request('DELETE', `${table}/${id}`),
};

export { TABLE_CATEGORY, TABLE_DISH };
