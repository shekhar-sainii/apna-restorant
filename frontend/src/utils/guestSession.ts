const GUEST_SESSION_KEY = "ar_guest_session_id";
const GUEST_ORDERS_KEY = "ar_guest_orders";

export function getOrCreateGuestSessionId(): string {
  let id = localStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

export function saveGuestOrder(orderId: string, orderNumber: string) {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    const list: { id: string; orderNumber: string; createdAt: string }[] = raw
      ? JSON.parse(raw)
      : [];
    list.unshift({ id: orderId, orderNumber, createdAt: new Date().toISOString() });
    localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    localStorage.setItem(
      GUEST_ORDERS_KEY,
      JSON.stringify([{ id: orderId, orderNumber, createdAt: new Date().toISOString() }])
    );
  }
}

export function getGuestOrders(): { id: string; orderNumber: string; createdAt: string }[] {
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
