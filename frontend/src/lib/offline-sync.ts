const DB_NAME = "baay-offline-db";
const DB_VERSION = 2;
const STORE_NAME = "pending-sales";
const PRODUCTS_STORE = "cached-products";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "local_id" });
      }
      if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
        db.createObjectStore(PRODUCTS_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function queueSaleOffline(sale: any): Promise<string> {
  const local_id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put({ ...sale, local_id, created_at: new Date().toISOString() });
  return local_id;
}

export async function getPendingSales(): Promise<any[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingSale(local_id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(local_id);
}

export async function clearPendingSales(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.clear();
}

export async function syncPendingSales(): Promise<{ synced: number; errors: number }> {
  const pending = await getPendingSales();
  if (pending.length === 0) return { synced: 0, errors: 0 };

  try {
    const api = (await import("@/lib/api")).default;
    const res = await api.post("/sales/sync", { sales: pending });
    const { synced, errors } = res.data;

    for (const item of res.data.details || []) {
      await removePendingSale(item.local_id);
    }

    return { synced, errors };
  } catch {
    return { synced: 0, errors: pending.length };
  }
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

export function onOnlineChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

// Product caching for offline support
export async function cacheProducts(products: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(PRODUCTS_STORE, "readwrite");
  const store = tx.objectStore(PRODUCTS_STORE);
  for (const product of products) {
    store.put(product);
  }
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await openDB();
  const tx = db.transaction(PRODUCTS_STORE, "readonly");
  const store = tx.objectStore(PRODUCTS_STORE);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearCachedProducts(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(PRODUCTS_STORE, "readwrite");
  const store = tx.objectStore(PRODUCTS_STORE);
  store.clear();
}

export async function loadProductsWithCache(): Promise<any[]> {
  const cached = await getCachedProducts();
  if (cached.length > 0) {
    // Return cached products and refresh in background
    import("@/lib/api").then(({ default: api }) => {
      api.get("/products/").then((res) => {
        cacheProducts(res.data);
      }).catch(() => {});
    });
    return cached;
  }
  // No cache, fetch from API
  const { default: api } = await import("@/lib/api");
  const res = await api.get("/products/");
  await cacheProducts(res.data);
  return res.data;
}
