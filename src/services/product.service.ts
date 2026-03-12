import ProductModel from "@/models/product.model";
import { ProductFilters } from "@/types/product.type";
import appAssert from "@/utils/appAssert";
import { NOT_FOUND } from "@/constants/http";

export const getAllProducts = async (filters: ProductFilters) => {
  const {
    category,
    minPrice,
    maxPrice,
    minRating,
    search,
    sort,
    page = 1,
    limit = 12,
  } = filters;

  const query: any = {};

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }

  if (minRating) {
    query.rating = { $gte: minRating };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const sortOptions: any = {};
  if (sort) {
    const [field, order] = sort.split(":");
    sortOptions[field] = order === "desc" ? -1 : 1;
  } else {
    sortOptions.createdAt = -1;
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    ProductModel.find(query).sort(sortOptions).skip(skip).limit(limit).populate("image"),
    ProductModel.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id: string) => {
  const product = await ProductModel.findById(id).populate("image");
  appAssert(product, NOT_FOUND, "Product not found");
  return product;
};

export const createProduct = async (data: any) => {
  const product = new ProductModel(data);
  await product.save();
  return product;
};

export const updateProduct = async (id: string, data: any) => {
  const product = await ProductModel.findByIdAndUpdate(id, data, { new: true });
  appAssert(product, NOT_FOUND, "Product not found");
  return product;
};

export const deleteProduct = async (id: string) => {
  const product = await ProductModel.findByIdAndDelete(id);
  appAssert(product, NOT_FOUND, "Product not found");
  return product;
};

export const getUniqueIngredients = async () => {
  const products = await ProductModel.find({}, 'recipe').lean();
  const ingredients = new Set<string>();

  products.forEach((p) => {
    p.recipe?.forEach((r) => {
      if (r.name) {
        const name = r.name.trim();
        if (name) ingredients.add(name);
      }
    });
  });

  return Array.from(ingredients).sort((a, b) => a.localeCompare(b, 'vi'));
};
