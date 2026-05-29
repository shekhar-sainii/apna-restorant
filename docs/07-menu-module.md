# 07 — Menu Module

> Categories, Menu Items, Image Upload via Cloudinary, QR Table System

---

## 1. Models

### Category Model — `src/models/Category.model.js`

```js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("Category", categorySchema);
```

### MenuItem Model — `src/models/MenuItem.model.js`

```js
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15 }, // minutes
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    tags: [{ type: String }],
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ isAvailable: 1, sortOrder: 1 });
menuItemSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("MenuItem", menuItemSchema);
```

---

## 2. Cloudinary Config — `src/config/cloudinary.js`

```js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

### Cloudinary Service — `src/services/cloudinary.service.js`

```js
const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");

class CloudinaryService {
  async uploadImage(filePath, folder = "restaurant/menu") {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        transformation: [
          { width: 800, height: 600, crop: "fill", quality: "auto" },
          { format: "webp" },
        ],
      });
      return result.secure_url;
    } catch (err) {
      throw ApiError.internal("Image upload failed");
    }
  }

  async deleteImage(imageUrl) {
    try {
      // Extract public_id from URL
      const parts = imageUrl.split("/");
      const filename = parts[parts.length - 1].split(".")[0];
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      // Non-critical — log but don't throw
      console.error("Cloudinary delete failed:", err.message);
    }
  }
}

module.exports = new CloudinaryService();
```

### Upload Middleware — `src/middleware/upload.middleware.js`

```js
const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/ApiError");

const storage = multer.diskStorage({
  destination: "/tmp/uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest("Only JPEG, PNG, WEBP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload };
```

---

## 3. Category Repository + Service

### `src/modules/menu/category.repository.js`

```js
const Category = require("../../models/Category.model");

class CategoryRepository {
  async findAll(activeOnly = true) {
    const query = activeOnly ? { isActive: true } : {};
    return Category.find(query).sort({ sortOrder: 1, name: 1 });
  }

  async findBySlug(slug) {
    return Category.findOne({ slug });
  }

  async findById(id) {
    return Category.findById(id);
  }

  async create(data) {
    return Category.create(data);
  }

  async update(id, data) {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return Category.findByIdAndDelete(id);
  }
}

module.exports = new CategoryRepository();
```

### `src/modules/menu/category.service.js`

```js
const categoryRepository = require("./category.repository");
const cloudinaryService = require("../../services/cloudinary.service");
const ApiError = require("../../utils/ApiError");

const slugify = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

class CategoryService {
  async getAll(includeInactive = false) {
    return categoryRepository.findAll(!includeInactive);
  }

  async create({ name, sortOrder, file }) {
    const slug = slugify(name);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw ApiError.conflict("Category already exists");

    let image = null;
    if (file) {
      image = await cloudinaryService.uploadImage(file.path, "restaurant/categories");
    }

    return categoryRepository.create({ name, slug, image, sortOrder: sortOrder || 0 });
  }

  async update(id, { name, isActive, sortOrder, file }) {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound("Category not found");

    const updates = {};
    if (name) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (isActive !== undefined) updates.isActive = isActive;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (file) {
      if (category.image) await cloudinaryService.deleteImage(category.image);
      updates.image = await cloudinaryService.uploadImage(file.path, "restaurant/categories");
    }

    return categoryRepository.update(id, updates);
  }

  async delete(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound("Category not found");
    if (category.image) await cloudinaryService.deleteImage(category.image);
    return categoryRepository.delete(id);
  }
}

module.exports = new CategoryService();
```

---

## 4. MenuItem Repository + Service

### `src/modules/menu/menuItem.repository.js`

```js
const MenuItem = require("../../models/MenuItem.model");

class MenuItemRepository {
  async findAll({ category, isVeg, isAvailable, search, page = 1, limit = 20 }) {
    const query = {};
    if (category) query.category = category;
    if (isVeg !== undefined) query.isVeg = isVeg;
    if (isAvailable !== undefined) query.isAvailable = isAvailable;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      MenuItem.find(query)
        .populate("category", "name slug")
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      MenuItem.countDocuments(query),
    ]);
    return { items, total };
  }

  async findById(id) {
    return MenuItem.findById(id).populate("category", "name slug");
  }

  async create(data) {
    return MenuItem.create(data);
  }

  async update(id, data) {
    return MenuItem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return MenuItem.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return MenuItem.find({ _id: { $in: ids } });
  }
}

module.exports = new MenuItemRepository();
```

### `src/modules/menu/menuItem.service.js`

```js
const menuItemRepository = require("./menuItem.repository");
const cloudinaryService = require("../../services/cloudinary.service");
const ApiError = require("../../utils/ApiError");

class MenuItemService {
  async getAll(filters) {
    return menuItemRepository.findAll(filters);
  }

  async getById(id) {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");
    return item;
  }

  async create({ name, description, price, category, isVeg, preparationTime, tags, sortOrder, file }) {
    let image = null;
    if (file) {
      image = await cloudinaryService.uploadImage(file.path, "restaurant/menu");
    }

    return menuItemRepository.create({
      name,
      description,
      price: Number(price),
      image,
      category,
      isVeg: isVeg === "true" || isVeg === true,
      preparationTime: Number(preparationTime) || 15,
      tags: tags ? JSON.parse(tags) : [],
      sortOrder: Number(sortOrder) || 0,
    });
  }

  async update(id, updates, file) {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");

    if (file) {
      if (item.image) await cloudinaryService.deleteImage(item.image);
      updates.image = await cloudinaryService.uploadImage(file.path, "restaurant/menu");
    }

    if (updates.price) updates.price = Number(updates.price);
    if (updates.isVeg !== undefined) updates.isVeg = updates.isVeg === "true" || updates.isVeg === true;

    return menuItemRepository.update(id, updates);
  }

  async toggleAvailability(id) {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");
    return menuItemRepository.update(id, { isAvailable: !item.isAvailable });
  }

  async delete(id) {
    const item = await menuItemRepository.findById(id);
    if (!item) throw ApiError.notFound("Menu item not found");
    if (item.image) await cloudinaryService.deleteImage(item.image);
    return menuItemRepository.delete(id);
  }
}

module.exports = new MenuItemService();
```

---

## 5. Menu Routes — `src/modules/menu/menu.routes.js`

```js
const router = require("express").Router();
const categoryController = require("./category.controller");
const menuItemController = require("./menuItem.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireRole } = require("../../middleware/role.middleware");
const { upload } = require("../../middleware/upload.middleware");

// ─── Category routes ───────────────────────────────────────
router.get("/categories", categoryController.getAll);
router.post("/categories",
  authenticate, requireRole("admin"),
  upload.single("image"),
  categoryController.create
);
router.patch("/categories/:id",
  authenticate, requireRole("admin"),
  upload.single("image"),
  categoryController.update
);
router.delete("/categories/:id",
  authenticate, requireRole("admin"),
  categoryController.remove
);

// ─── Menu Item routes ──────────────────────────────────────
router.get("/items", menuItemController.getAll);
router.get("/items/:id", menuItemController.getById);
router.post("/items",
  authenticate, requireRole("admin"),
  upload.single("image"),
  menuItemController.create
);
router.patch("/items/:id",
  authenticate, requireRole("admin"),
  upload.single("image"),
  menuItemController.update
);
router.patch("/items/:id/toggle",
  authenticate, requireRole("admin"),
  menuItemController.toggleAvailability
);
router.delete("/items/:id",
  authenticate, requireRole("admin"),
  menuItemController.remove
);

module.exports = router;
```

---

## 6. QR Table System

### How QR Codes Work

Each table has a printed QR code pointing to:
```
https://yourdomain.com/table/1
https://yourdomain.com/table/2
```

No special backend endpoint needed — it's just the frontend URL.

### Frontend: TableMenuPage.tsx

```tsx
// src/pages/public/TableMenuPage.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTableNumber, setGuestSessionId } from "../../features/guest/guestSlice";
import { v4 as uuidv4 } from "uuid";
import MenuPage from "./MenuPage";

const TableMenuPage = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const dispatch = useDispatch();

  useEffect(() => {
    // Store table number in Redux + localStorage
    if (tableId) {
      dispatch(setTableNumber(Number(tableId)));
      localStorage.setItem("tableNumber", tableId);
    }

    // Create or reuse guest session
    let sessionId = localStorage.getItem("guestSessionId");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("guestSessionId", sessionId);
    }
    dispatch(setGuestSessionId(sessionId));
  }, [tableId, dispatch]);

  return <MenuPage isTableMode tableNumber={Number(tableId)} />;
};

export default TableMenuPage;
```

### Guest Slice — `src/features/guest/guestSlice.ts`

```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GuestState {
  guestSessionId: string | null;
  tableNumber: number | null;
}

const initialState: GuestState = {
  guestSessionId: localStorage.getItem("guestSessionId"),
  tableNumber: localStorage.getItem("tableNumber")
    ? Number(localStorage.getItem("tableNumber"))
    : null,
};

const guestSlice = createSlice({
  name: "guest",
  initialState,
  reducers: {
    setGuestSessionId(state, action: PayloadAction<string>) {
      state.guestSessionId = action.payload;
      localStorage.setItem("guestSessionId", action.payload);
    },
    setTableNumber(state, action: PayloadAction<number>) {
      state.tableNumber = action.payload;
      localStorage.setItem("tableNumber", String(action.payload));
    },
    clearGuestSession(state) {
      state.guestSessionId = null;
      state.tableNumber = null;
      localStorage.removeItem("guestSessionId");
      localStorage.removeItem("tableNumber");
    },
  },
});

export const { setGuestSessionId, setTableNumber, clearGuestSession } = guestSlice.actions;
export default guestSlice.reducer;
```

---

## 7. Generate QR Codes for Tables (Admin)

In Admin Settings page, generate printable QR codes:

```tsx
// Install: npm install qrcode.react
import QRCode from "qrcode.react";

const TableQRCodes = ({ tableCount }: { tableCount: number }) => (
  <div className="grid grid-cols-3 gap-6">
    {Array.from({ length: tableCount }, (_, i) => i + 1).map((n) => (
      <div key={n} className="border p-4 text-center rounded-lg">
        <QRCode
          value={`${import.meta.env.VITE_FRONTEND_URL}/table/${n}`}
          size={180}
          level="H"
        />
        <p className="mt-2 font-semibold">Table {n}</p>
      </div>
    ))}
  </div>
);
```

Print this page to get all table QR codes on paper.

---

## Next → `08-order-module.md`
