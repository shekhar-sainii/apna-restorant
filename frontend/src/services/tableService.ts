import fetchApi from "./api";

export interface DiningTable {
  _id: string;
  tableNumber: number;
  label: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
  isActive: boolean;
}

export const tableService = {
  getAll: (): Promise<{ data: DiningTable[] }> => fetchApi("/tables"),

  getByNumber: (tableNumber: number): Promise<{ data: DiningTable }> =>
    fetchApi(`/tables/number/${tableNumber}`),

  create: (data: { tableNumber: number; label: string; capacity: number }) =>
    fetchApi("/tables", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<DiningTable>) =>
    fetchApi(`/tables/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) => fetchApi(`/tables/${id}`, { method: "DELETE" }),
};

export default tableService;
