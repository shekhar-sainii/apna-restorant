import cloudinary from "../config/cloudinary";
import ApiError from "../utils/ApiError";

class CloudinaryService {
  async uploadImage(filePath: string, folder = "restaurant/menu"): Promise<string> {
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

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const parts = imageUrl.split("/");
      const filename = parts[parts.length - 1].split(".")[0];
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (err: any) {
      console.error("Cloudinary delete failed:", err.message || err);
    }
  }
}

export default new CloudinaryService();
