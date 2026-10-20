// Kho dữ liệu: MockAPI là nguồn chính, AsyncStorage là bộ nhớ local (cache + hàng đợi thay đổi chờ đồng bộ)
// Luồng: mọi thay đổi -> ghi vào local ngay -> đưa vào hàng đợi -> có mạng thì tự đẩy lên MockAPI -> kéo dữ liệu mới về.
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { P, TABLE_CATEGORY, TABLE_DISH } from './config';
import { api } from './api';
import { categoryToApi, categoryFromApi, dishToApi, dishFromApi } from './schema';

const STORAGE_KEY = `${P}FoodManagerData`; // key lưu local có tiền tố MSSV
const SEEDED_KEY = `${P}Seeded`;

let state = {
  ready: false,
  categories: [],
  dishes: [],
  queue: [], // [{entity:'category'|'dish', type:'create'|'update'|'delete', id}]
  online: true,
  syncing: false,
  error: false,
};
const listeners = new Set();
const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const getState = () => state;
const hasUsableId = (record) =>
  record?.id != null && String(record.id).trim() !== '' && record.id !== 'undefined' && record.id !== 'null';
const setState = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const useStore = () => useSyncExternalStore(subscribe, getState);

const persist = () =>
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ categories: state.categories, dishes: state.dishes, queue: state.queue })
  ).catch(() => {});

const isLocalId = (id) => String(id).startsWith('local_');
const newLocalId = () => `local_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

// ---------- Hàng đợi thay đổi (gộp thao tác để không phát sinh bản ghi trùng) ----------
function addOp(queue, entity, type, id) {
  const same = (o) => o.entity === entity && o.id === id;
  const pending = queue.filter(same);
  if (type === 'create') return [...queue, { entity, type, id }];
  if (type === 'update') return pending.length ? queue : [...queue, { entity, type, id }];
  // delete: bản ghi chưa từng lên server thì bỏ hẳn, ngược lại đẩy lệnh xóa
  if (pending.some((o) => o.type === 'create')) return queue.filter((o) => !same(o));
  return [...queue.filter((o) => !same(o)), { entity, type, id }];
}

function commit(patch, op) {
  const queue = op ? addOp(state.queue, op.entity, op.type, op.id) : state.queue;
  setState({ ...patch, queue });
  persist();
  sync();
}

// ---------- Đồng bộ ----------
let running = false;

const nextOp = () =>
  state.queue.find((o) => o.entity === 'category' && o.type === 'create') || state.queue[0];

function remapId(entity, oldId, newId, sentRec) {
  const rename = (r) => (r.id === oldId ? { ...r, id: newId } : r);
  const list = entity === 'category' ? state.categories : state.dishes;
  const current = list.find((r) => r.id === oldId);
  const patch = {
    queue: state.queue.map((o) =>
      o.entity === entity && o.id === oldId && o.type !== 'create' ? { ...o, id: newId } : o
    ),
  };
  if (entity === 'category') {
    patch.categories = state.categories.map(rename);
    // đổi tham chiếu loại món local -> id thật của server
    patch.dishes = state.dishes.map((d) => (d.categoryId === oldId ? { ...d, categoryId: newId } : d));
  } else {
    patch.dishes = state.dishes.map(rename);
  }
  setState(patch);
  // người dùng sửa/xóa trong lúc đang gửi -> bổ sung lệnh tương ứng
  if (!current) setState({ queue: addOp(state.queue, entity, 'delete', newId) });
  else if (current !== sentRec) setState({ queue: addOp(state.queue, entity, 'update', newId) });
}

async function processOp(op) {
  const isCat = op.entity === 'category';
  const table = isCat ? TABLE_CATEGORY : TABLE_DISH;
  const toApi = isCat ? categoryToApi : dishToApi;
  const rec = (isCat ? state.categories : state.dishes).find((r) => r.id === op.id);

  if (op.type === 'delete') {
    if (isLocalId(op.id)) return;
    try {
      await api.remove(table, op.id);
    } catch (e) {
      if (e.status !== 404) throw e;
    }
    return;
  }
  if (!rec) return;
  if (op.type === 'update') {
    try {
      await api.update(table, rec.id, toApi(rec));
    } catch (e) {
      if (e.status !== 404) throw e; // Id không tồn tại trên server -> bỏ qua
    }
    return;
  }
  const created = await api.create(table, toApi(rec));
  remapId(op.entity, op.id, String(created.id), rec);
}

export async function sync() {
  if (running || !state.online || !state.ready) return;
  running = true;
  setState({ syncing: true });
  try {
    do {
      while (state.queue.length) {
        const op = nextOp();
        await processOp(op);
        setState({ queue: state.queue.filter((o) => o !== op) });
        await persist();
      }
      const [cats, dishes] = await Promise.all([api.list(TABLE_CATEGORY), api.list(TABLE_DISH)]);
      // chỉ ghi đè local khi không còn thay đổi chờ đẩy
      if (!state.queue.length) {
        setState({
          categories: cats.filter(hasUsableId).map(categoryFromApi),
          dishes: dishes.filter(hasUsableId).map(dishFromApi),
        });
        await persist();
      }
    } while (state.queue.length);
    setState({ error: false });
  } catch (e) {
    setState({ error: true });
  } finally {
    running = false;
    setState({ syncing: false });
  }
}

// ---------- Khởi tạo ----------
const SEED_CATEGORIES = [
  { name: 'Main Course', description: 'Pizza, burgers and other main dishes' },
  { name: 'Dessert', description: 'Sweet dishes' },
  { name: 'Drinks', description: 'Coffee, juice and other beverages' },
];
const img = (id) => `https://images.unsplash.com/${id}?w=600&q=70`;
const SEED_DISHES = [
  { name: 'Margherita Pizza', price: 120000, prep: 20, cat: 0, avail: true, desc: 'Tomato, mozzarella, basil', imgs: ['photo-1513104890138-7c749659a591', 'photo-1574071318508-1cdbab80d002'] },
  { name: 'Cheeseburger', price: 85000, prep: 12, cat: 0, avail: true, desc: 'Beef patty with cheese', imgs: ['photo-1568901346375-23c9450c58cd'] },
  { name: 'Chocolate Cake', price: 55000, prep: 10, cat: 1, avail: true, desc: 'Rich chocolate cake', imgs: ['photo-1578985545062-69928b1d9587'] },
  { name: 'Iced Coffee', price: 35000, prep: 5, cat: 2, avail: true, desc: 'Cold brewed coffee', imgs: ['photo-1461023058943-07fcbe16d735'] },
  { name: 'Orange Juice', price: 30000, prep: 5, cat: 2, avail: false, desc: 'Fresh orange juice', imgs: ['photo-1600271886742-f049cd451bba'] },
];

async function seedIfEmpty() {
  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded || state.error || !state.online) return;
  if (state.categories.length || state.dishes.length || state.queue.length) return;
  const catIds = SEED_CATEGORIES.map((c) => {
    const id = newLocalId();
    state = { ...state, categories: [...state.categories, { id, ...c }], queue: addOp(state.queue, 'category', 'create', id) };
    return id;
  });
  SEED_DISHES.forEach((d) => {
    const id = newLocalId();
    const dish = {
      id, name: d.name, price: d.price, preparationTime: d.prep, isAvailable: d.avail, description: d.desc,
      categoryId: catIds[d.cat],
      images: d.imgs.map((x, i) => ({ imageUrl: img(x), isThumbnail: i === 0 })),
    };
    state = { ...state, dishes: [...state.dishes, dish], queue: addOp(state.queue, 'dish', 'create', id) };
  });
  await AsyncStorage.setItem(SEEDED_KEY, '1');
  commit({});
}

let started = false;
export async function init() {
  if (started) return;
  started = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      setState({
        categories: (d.categories || []).filter(hasUsableId),
        dishes: (d.dishes || []).filter(hasUsableId),
        queue: d.queue || [],
      });
    }
  } catch (e) {}
  setState({ ready: true });

  // Tự phát hiện có/mất mạng và tự đồng bộ khi có mạng trở lại
  NetInfo.addEventListener((s) => {
    const online = !!s.isConnected && s.isInternetReachable !== false;
    setState({ online });
    if (online) sync();
  });
  // Thử lại định kỳ nếu còn thay đổi chờ hoặc server lỗi
  setInterval(() => {
    if (state.online && (state.queue.length || state.error)) sync();
  }, 10000);

  await sync();
  await seedIfEmpty();
}

// ---------- Validation ----------
export function validateDish(input, id) {
  const errors = {};
  const name = (input.name || '').trim();
  const num = (v) => (String(v).trim() === '' ? NaN : Number(v));
  if (!name) errors.name = 'nameRequired';
  const price = num(input.price);
  if (!isFinite(price) || price <= 0) errors.price = 'priceInvalid';
  const prep = num(input.preparationTime);
  if (!isFinite(prep) || prep <= 0) errors.preparationTime = 'prepInvalid';
  if (!state.categories.some((c) => c.id === input.categoryId)) errors.categoryId = 'categoryInvalid';
  else if (
    name &&
    state.dishes.some(
      (d) => d.id !== id && d.categoryId === input.categoryId && d.name.trim().toLowerCase() === name.toLowerCase()
    )
  )
    errors.name = 'nameDuplicate';
  return errors;
}

// ---------- Thao tác dữ liệu ----------
export function saveDish(input, id) {
  const errors = validateDish(input, id);
  if (Object.keys(errors).length) return { ok: false, errors };
  const data = {
    name: input.name.trim(),
    price: Number(input.price),
    preparationTime: Number(input.preparationTime),
    isAvailable: !!input.isAvailable,
    description: (input.description || '').trim(),
    categoryId: input.categoryId,
  };
  if (id) {
    const old = state.dishes.find((d) => d.id === id);
    if (!old) return { ok: false, errors: { general: 'dishNotFound' } };
    commit({ dishes: state.dishes.map((d) => (d.id === id ? { ...old, ...data } : d)) }, { entity: 'dish', type: 'update', id });
    return { ok: true, id };
  }
  const newId = newLocalId();
  commit({ dishes: [...state.dishes, { id: newId, ...data, images: [] }] }, { entity: 'dish', type: 'create', id: newId });
  return { ok: true, id: newId };
}

export function deleteDish(id) {
  commit({ dishes: state.dishes.filter((d) => d.id !== id) }, { entity: 'dish', type: 'delete', id });
}

export function addImage(dishId, url) {
  const u = (url || '').trim();
  if (!/^https?:\/\/\S+$/i.test(u)) return { ok: false, error: 'imageUrlInvalid' };
  const dish = state.dishes.find((d) => d.id === dishId);
  if (!dish) return { ok: false, error: 'dishNotFound' };
  const hasThumb = dish.images.some((i) => i.isThumbnail);
  const images = [...dish.images, { imageUrl: u, isThumbnail: !hasThumb }];
  commit({ dishes: state.dishes.map((d) => (d.id === dishId ? { ...d, images } : d)) }, { entity: 'dish', type: 'update', id: dishId });
  return { ok: true };
}

export function setThumbnail(dishId, index) {
  const dish = state.dishes.find((d) => d.id === dishId);
  if (!dish) return;
  const images = dish.images.map((i, k) => ({ ...i, isThumbnail: k === index })); // tối đa 1 ảnh đại diện
  commit({ dishes: state.dishes.map((d) => (d.id === dishId ? { ...d, images } : d)) }, { entity: 'dish', type: 'update', id: dishId });
}

export function createCategory({ name, description }) {
  if (!(name || '').trim()) return { ok: false, error: 'nameRequired' };
  const id = newLocalId();
  commit(
    { categories: [...state.categories, { id, name: name.trim(), description: (description || '').trim() }] },
    { entity: 'category', type: 'create', id }
  );
  return { ok: true };
}

export function deleteCategory(id) {
  if (state.dishes.some((d) => d.categoryId === id)) return { ok: false, error: 'categoryInUse' };
  commit({ categories: state.categories.filter((c) => c.id !== id) }, { entity: 'category', type: 'delete', id });
  return { ok: true };
}
