import Order, { IOrderDocument } from "../../models/Order.model";

export interface OrderQueryFilters {
  status?: string;
  page?: number | string;
  limit?: number | string;
  fromDate?: string;
  toDate?: string;
}

class OrderRepository {
  async create(data: Partial<IOrderDocument>): Promise<IOrderDocument> {
    return Order.create(data);
  }

  async findById(id: string): Promise<IOrderDocument | null> {
    return Order.findById(id)
      .populate("customer", "name email phone")
      .populate("assignedStaff", "name phone")
      .populate("items.menuItem", "name image");
  }

  async findByGuestSession(guestSessionId: string): Promise<IOrderDocument[]> {
    return Order.find({ guestSessionId }).sort({ createdAt: -1 });
  }

  async findByCustomer(customerId: string, { page = 1, limit = 10 }: { page?: number | string; limit?: number | string }): Promise<{ orders: IOrderDocument[]; total: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const [orders, total] = await Promise.all([
      Order.find({ customer: customerId as any })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments({ customer: customerId as any }),
    ]);
    return { orders, total };
  }

  async findAll({ status, page = 1, limit = 20, fromDate, toDate }: OrderQueryFilters): Promise<{ orders: IOrderDocument[]; total: number }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const query: any = {};
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const skip = (pageNum - 1) * limitNum;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("customer", "name phone")
        .populate("assignedStaff", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);
    return { orders, total };
  }

  async findActiveForStaff(staffId: string): Promise<IOrderDocument[]> {
    return Order.find({
      $or: [
        { assignedStaff: staffId as any },
        { status: { $in: ["pending", "accepted", "preparing", "ready"] } },
      ],
    })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
  }

  async updateStatus(id: string, status: string, updatedBy: string, note?: string): Promise<IOrderDocument | null> {
    return Order.findByIdAndUpdate(
      id,
      {
        status,
        $push: {
          statusHistory: {
            status,
            updatedBy: updatedBy as any,
            updatedAt: new Date(),
            note: note || "",
          },
        },
      },
      { new: true }
    );
  }

  async assignStaff(id: string, staffId: string): Promise<IOrderDocument | null> {
    return Order.findByIdAndUpdate(id, { assignedStaff: staffId as any }, { new: true });
  }

  async updatePaymentStatus(id: string, paymentStatus: string, razorpayPaymentId?: string): Promise<IOrderDocument | null> {
    return Order.findByIdAndUpdate(
      id,
      { paymentStatus, razorpayPaymentId },
      { new: true }
    );
  }
}

export default new OrderRepository();
