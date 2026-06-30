import { Request, Response } from 'express';
import { PrismaClient, ProductType, InventoryStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

// Helper to generate URL safe slugs
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
}

// Zod Validation Schemas
const sportSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional()
});

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional()
});

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  parentId: z.string().uuid().nullable().optional()
});

const productSchema = z.object({
  sportId: z.string().uuid('Invalid Sport ID.'),
  brandId: z.string().uuid('Invalid Brand ID.'),
  categoryId: z.string().uuid('Invalid Category ID.'),
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  type: z.nativeEnum(ProductType),
  retailPrice: z.number().nonnegative().nullable().optional(),
  baseRentalRate: z.number().nonnegative().nullable().optional(),
  securityDeposit: z.number().nonnegative().nullable().optional(),
  images: z.array(z.string().url()).optional()
});

const inventoryUnitSchema = z.object({
  productId: z.string().uuid('Invalid Product ID.'),
  serialNumber: z.string().optional(),
  inventoryCode: z.string().min(1, 'Inventory code is required.'),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  status: z.nativeEnum(InventoryStatus).optional(),
  branch: z.string().optional(),
  purchaseDate: z.string().datetime().optional().nullable(),
  condition: z.string().optional()
});

const bulkGenerateSchema = z.object({
  productId: z.string().uuid('Invalid Product ID.'),
  prefix: z.string().min(1, 'Prefix is required (e.g. BAT-).'),
  startNumber: z.number().int().positive().default(1),
  count: z.number().int().positive().max(100, 'Cannot generate more than 100 units at once.'),
  branch: z.string().default('Main'),
  condition: z.string().default('excellent')
});

// ==========================================
// SPORTS CRUD
// ==========================================

export async function listSports(req: Request, res: Response) {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [sports, total] = await prisma.$transaction([
      prisma.sport.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.sport.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        sports,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed fetching sports.' } });
  }
}

export async function createSport(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = sportSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { name, description } = parse.data;
    const slug = slugify(name);

    const existing = await prisma.sport.findFirst({ where: { OR: [{ name }, { slug }], deletedAt: null } });
    if (existing) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Sport already exists.' } });

    const sport = await prisma.sport.create({
      data: { name, slug, description }
    });

    return res.status(201).json({ success: true, data: { sport } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed creating sport.' } });
  }
}

export async function updateSport(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const parse = sportSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { name, description } = parse.data;

    const sport = await prisma.sport.findFirst({ where: { id, deletedAt: null } });
    if (!sport) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sport not found.' } });

    const slug = slugify(name);
    const updated = await prisma.sport.update({
      where: { id },
      data: { name, slug, description }
    });

    return res.status(200).json({ success: true, data: { sport: updated } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed updating sport.' } });
  }
}

export async function deleteSport(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const sport = await prisma.sport.findFirst({ where: { id, deletedAt: null } });
    if (!sport) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sport not found.' } });

    await prisma.sport.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return res.status(200).json({ success: true, data: { message: 'Sport soft-deleted successfully.' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed deleting sport.' } });
  }
}

// ==========================================
// BRANDS CRUD
// ==========================================

export async function listBrands(req: Request, res: Response) {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [brands, total] = await prisma.$transaction([
      prisma.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.brand.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        brands,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed fetching brands.' } });
  }
}

export async function createBrand(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = brandSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { name, description } = parse.data;
    const slug = slugify(name);

    const existing = await prisma.brand.findFirst({ where: { OR: [{ name }, { slug }], deletedAt: null } });
    if (existing) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Brand already exists.' } });

    const brand = await prisma.brand.create({
      data: { name, slug, description }
    });

    return res.status(201).json({ success: true, data: { brand } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed creating brand.' } });
  }
}

export async function updateBrand(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const parse = brandSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { name, description } = parse.data;

    const brand = await prisma.brand.findFirst({ where: { id, deletedAt: null } });
    if (!brand) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found.' } });

    const slug = slugify(name);
    const updated = await prisma.brand.update({
      where: { id },
      data: { name, slug, description }
    });

    return res.status(200).json({ success: true, data: { brand: updated } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed updating brand.' } });
  }
}

export async function deleteBrand(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findFirst({ where: { id, deletedAt: null } });
    if (!brand) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found.' } });

    await prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return res.status(200).json({ success: true, data: { message: 'Brand soft-deleted successfully.' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed deleting brand.' } });
  }
}

// ==========================================
// CATEGORIES CRUD
// ==========================================

export async function listCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed fetching categories.' } });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { name, parentId } = parse.data;
    const slug = slugify(name);

    if (parentId) {
      const parent = await prisma.category.findFirst({ where: { id: parentId, deletedAt: null } });
      if (!parent) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Parent category not found.' } });
    }

    const existing = await prisma.category.findFirst({ where: { OR: [{ name }, { slug }], deletedAt: null } });
    if (existing) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Category already exists.' } });

    const category = await prisma.category.create({
      data: { name, slug, parentId }
    });

    return res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed creating category.' } });
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { name, parentId } = parse.data;

    const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!category) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } });

    if (parentId === id) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'A category cannot be its own parent.' } });

    if (parentId) {
      const parent = await prisma.category.findFirst({ where: { id: parentId, deletedAt: null } });
      if (!parent) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Parent category not found.' } });
    }

    const slug = slugify(name);
    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug, parentId }
    });

    return res.status(200).json({ success: true, data: { category: updated } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed updating category.' } });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const category = await prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!category) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } });

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return res.status(200).json({ success: true, data: { message: 'Category soft-deleted successfully.' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed deleting category.' } });
  }
}

// ==========================================
// PRODUCTS CRUD
// ==========================================

export async function listProducts(req: Request, res: Response) {
  try {
    const search = req.query.search as string;
    const sportId = req.query.sportId as string;
    const brandId = req.query.brandId as string;
    const categoryId = req.query.categoryId as string;
    const type = req.query.type as ProductType;

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (sportId) where.sportId = sportId;
    if (brandId) where.brandId = brandId;
    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          sport: { select: { name: true } },
          brand: { select: { name: true } },
          category: { select: { name: true } },
          images: true
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed fetching products.' } });
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = productSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { sportId, brandId, categoryId, name, description, type, retailPrice, baseRentalRate, securityDeposit, images } = parse.data;
    const slug = slugify(name);

    // Validate relationships
    const [sport, brand, category] = await Promise.all([
      prisma.sport.findFirst({ where: { id: sportId, deletedAt: null } }),
      prisma.brand.findFirst({ where: { id: brandId, deletedAt: null } }),
      prisma.category.findFirst({ where: { id: categoryId, deletedAt: null } })
    ]);

    if (!sport || !brand || !category) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Mapped sport, brand, or category profile not found.' } });
    }

    const existing = await prisma.product.findFirst({ where: { OR: [{ name }, { slug }], deletedAt: null } });
    if (existing) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Product name/slug already registered.' } });

    const product = await prisma.product.create({
      data: {
        sportId,
        brandId,
        categoryId,
        name,
        slug,
        description,
        type,
        retailPrice,
        baseRentalRate,
        securityDeposit,
        images: images && images.length > 0 ? {
          create: images.map((url, index) => ({
            url,
            isPrimary: index === 0
          }))
        } : undefined
      },
      include: { images: true }
    });

    return res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed creating product.' } });
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const parse = productSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { sportId, brandId, categoryId, name, description, type, retailPrice, baseRentalRate, securityDeposit, images } = parse.data;

    const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });

    const slug = slugify(name);
    const updated = await prisma.$transaction(async (tx) => {
      // Clear old images if new ones are passed
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          sportId,
          brandId,
          categoryId,
          name,
          slug,
          description,
          type,
          retailPrice,
          baseRentalRate,
          securityDeposit,
          images: images && images.length > 0 ? {
            create: images.map((url, index) => ({
              url,
              isPrimary: index === 0
            }))
          } : undefined
        },
        include: { images: true }
      });
    });

    return res.status(200).json({ success: true, data: { product: updated } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed updating product.' } });
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return res.status(200).json({ success: true, data: { message: 'Product soft-deleted successfully.' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed deleting product.' } });
  }
}

// ==========================================
// INVENTORY UNITS CRUD
// ==========================================

export async function listInventoryUnits(req: Request, res: Response) {
  try {
    const productId = req.query.productId as string;
    const status = req.query.status as InventoryStatus;
    const branch = req.query.branch as string;
    const search = req.query.search as string;

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (branch) where.branch = branch;
    if (search) {
      where.OR = [
        { inventoryCode: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [units, total] = await prisma.$transaction([
      prisma.inventoryUnit.findMany({
        where,
        include: {
          product: { select: { name: true, type: true } }
        },
        orderBy: { inventoryCode: 'asc' },
        skip,
        take: limit
      }),
      prisma.inventoryUnit.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        units,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed fetching inventory units.' } });
  }
}

export async function createInventoryUnit(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = inventoryUnitSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { productId, serialNumber, inventoryCode, barcode, qrCode, status, branch, purchaseDate, condition } = parse.data;

    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product profile not found.' } });

    const existingCode = await prisma.inventoryUnit.findUnique({ where: { inventoryCode } });
    if (existingCode) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Inventory code is already in use.' } });

    const unit = await prisma.inventoryUnit.create({
      data: {
        productId,
        serialNumber,
        inventoryCode,
        barcode,
        qrCode: qrCode || `sportnest-qr-${inventoryCode}`,
        status: status || InventoryStatus.available,
        branch: branch || 'Main',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        condition: condition || 'excellent',
        availability: status === InventoryStatus.available || status === undefined
      }
    });

    return res.status(201).json({ success: true, data: { unit } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed creating inventory unit.' } });
  }
}

export async function bulkGenerateInventoryUnits(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = bulkGenerateSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { productId, prefix, startNumber, count, branch, condition } = parse.data;

    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product profile not found.' } });

    const generatedUnits: any[] = [];
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        const index = startNumber + i;
        // Pad code number, e.g. BAT-001
        const indexStr = index.toString().padStart(3, '0');
        const inventoryCode = `${prefix}${indexStr}`;

        // Verify if code exists
        const existing = await tx.inventoryUnit.findUnique({ where: { inventoryCode } });
        if (existing) {
          throw new Error(`Inventory code collision: ${inventoryCode} is already registered.`);
        }

        const unit = await tx.inventoryUnit.create({
          data: {
            productId,
            inventoryCode,
            qrCode: `sportnest-qr-${inventoryCode}`,
            status: InventoryStatus.available,
            branch,
            condition,
            availability: true
          }
        });
        generatedUnits.push(unit);
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        message: `Successfully batch generated ${count} inventory units.`,
        units: generatedUnits
      }
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Bulk generation transaction failed.' } });
  }
}

export async function updateInventoryUnit(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const parse = inventoryUnitSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { serialNumber, inventoryCode, barcode, qrCode, status, branch, purchaseDate, condition } = parse.data;

    const unit = await prisma.inventoryUnit.findUnique({ where: { id } });
    if (!unit) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inventory unit not found.' } });

    if (inventoryCode && inventoryCode !== unit.inventoryCode) {
      const existing = await prisma.inventoryUnit.findUnique({ where: { inventoryCode } });
      if (existing) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Inventory code is already in use.' } });
    }

    const isAvailable = status ? status === InventoryStatus.available : unit.availability;

    const updated = await prisma.inventoryUnit.update({
      where: { id },
      data: {
        serialNumber,
        inventoryCode,
        barcode,
        qrCode,
        status,
        branch,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        condition,
        availability: isAvailable
      }
    });

    return res.status(200).json({ success: true, data: { unit: updated } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed updating inventory unit.' } });
  }
}
