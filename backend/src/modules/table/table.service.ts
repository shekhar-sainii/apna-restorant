import tableRepository from "./table.repository";
import ApiError from "../../utils/ApiError";
import { TableStatus } from "../../models/DiningTable.model";

class TableService {
  async getAll() {
    return tableRepository.findAll();
  }

  async getByTableNumber(tableNumber: number) {
    const table = await tableRepository.findByTableNumber(tableNumber);
    if (!table) throw ApiError.notFound("Table not found or inactive");
    return table;
  }

  async create(data: { tableNumber: number; label: string; capacity: number }) {
    const existing = await tableRepository.findByTableNumberAny(data.tableNumber);
    if (existing) throw ApiError.conflict("Table number already exists");
    return tableRepository.create(data);
  }

  async update(id: string, data: Partial<{ label: string; capacity: number; status: TableStatus; isActive: boolean; tableNumber: number }>) {
    const table = await tableRepository.update(id, data);
    if (!table) throw ApiError.notFound("Table not found");
    return table;
  }

  async delete(id: string) {
    const table = await tableRepository.delete(id);
    if (!table) throw ApiError.notFound("Table not found");
    return table;
  }
}

export default new TableService();
