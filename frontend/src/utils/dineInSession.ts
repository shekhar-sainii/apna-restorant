/** Dine-in session when customer scans table QR — table is auto-selected, not manual. */

export interface DineInSession {
  tableNumber: number;
  tableLabel: string;
  status?: "available" | "occupied" | "reserved";
  startedAt: string;
}

const DINE_IN_KEY = "ar_dine_in_session";
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export function setDineInSession(session: Omit<DineInSession, "startedAt">) {
  const payload: DineInSession = { ...session, startedAt: new Date().toISOString() };
  localStorage.setItem(DINE_IN_KEY, JSON.stringify(payload));
}

export function getDineInSession(): DineInSession | null {
  try {
    const raw = localStorage.getItem(DINE_IN_KEY);
    if (!raw) return null;
    const session: DineInSession = JSON.parse(raw);
    const age = Date.now() - new Date(session.startedAt).getTime();
    if (age > SESSION_TTL_MS) {
      clearDineInSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearDineInSession() {
  localStorage.removeItem(DINE_IN_KEY);
}

export function isDineInMode(): boolean {
  return getDineInSession() !== null;
}

/** Parse ?table=5 or ?table=Table%205 from QR URL */
export function parseTableFromQuery(value: string | null): number | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  const num = parseInt(digits, 10);
  return Number.isNaN(num) || num < 1 ? null : num;
}
