import DiningTable, { IDiningTable, TableStatus } from "../../models/DiningTable.model";

class TableRepository {
  findAll() {
    return DiningTable.find().sort({ tableNumber: 1 });
  }

  findById(id: string) {
    return DiningTable.findById(id);
  }

  findByTableNumber(tableNumber: number) {
    return DiningTable.findOne({ tableNumber, isActive: true });
  }

  findByTableNumberAny(tableNumber: number) {
    return DiningTable.findOne({ tableNumber });
  }

  create(data: Partial<IDiningTable>) {
    return DiningTable.create(data);
  }

  update(id: string, data: Partial<IDiningTable>) {
    return DiningTable.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  delete(id: string) {
    return DiningTable.findByIdAndDelete(id);
  }

  updateStatus(id: string, status: TableStatus) {
    return DiningTable.findByIdAndUpdate(id, { status }, { new: true });
  }
}

export default new TableRepository();
