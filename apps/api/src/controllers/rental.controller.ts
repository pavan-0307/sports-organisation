import { Request, Response } from 'express';
import { PrismaClient, RentalOrderStatus, RentalInspectionType, InventoryStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

// Zod Input Validations
const availabilitySchema = z.object({
  productId: z.string().uuid('Invalid Product ID.'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid Product ID.'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  })).min(1, 'At least one item is required for rental.'),
  pickupSlot: z.string().datetime()
});

const paymentSchema = z.object({
  rentalOrderId: z.string().uuid('Invalid Order ID.'),
  paymentMethod: z.string().min(1),
  transactionId: z.string().min(1)
});

const verifyPickupSchema = z.object({
  verificationCode: z.string().min(1, 'Verification code is required.'),
  conditionScore: z.enum(['excellent', 'good', 'fair', 'poor']),
  notes: z.string().optional()
});

const verifyReturnSchema = z.object({
  inventoryCode: z.string().min(1, 'Inventory unit code is required.'),
  conditionScore: z.enum(['excellent', 'good', 'fair', 'poor']),
  notes: z.string().optional(),
  isDamaged: z.boolean().optional()
});

// Helper to calculate days between two dates
function calculateDays(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // Minimum 1 day rental fee
}

// Helper to generate verification code: RN-XXXXXX
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RN-${randomPart}`;
}

// ==========================================
// Life-cycle Controller Handlers
// ==========================================

export async function checkAvailability(req: Request, res: Response) {
  try {
    const parse = availabilitySchema.safeParse(req.query);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { productId, startDate, endDate } = parse.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all inventory units for the product that are available
    const units = await prisma.inventoryUnit.findMany({
      where: {
        productId,
        status: { in: [InventoryStatus.available, InventoryStatus.reserved] }
      }
    });

    if (units.length === 0) {
      return res.status(200).json({ success: true, data: { available: false, message: 'No physical inventory units registered.' } });
    }

    // Check for each unit if it is free during the period
    for (const unit of units) {
      const overlaps = await prisma.rentalOrderItem.findFirst({
        where: {
          inventoryUnitId: unit.id,
          returnedAt: null,
          rentalOrder: {
            status: { notIn: [RentalOrderStatus.cancelled, RentalOrderStatus.returned] }
          },
          OR: [
            { startDate: { lte: end }, endDate: { gte: start } }
          ]
        }
      });

      if (!overlaps) {
        return res.status(200).json({
          success: true,
          data: {
            available: true,
            unitId: unit.id,
            inventoryCode: unit.inventoryCode
          }
        });
      }
    }

    return res.status(200).json({ success: true, data: { available: false, message: 'All items are currently reserved for these dates.' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Availability check failed.' } });
  }
}

export async function createRentalOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = checkoutSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { items, pickupSlot } = parse.data;
    const customerId = req.user?.sub;

    if (!customerId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired.' } });

    let totalAmount = 0;
    let totalDeposit = 0;
    const reservedItems: any[] = [];

    // Begin check operations
    for (const item of items) {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const days = calculateDays(start, end);

      const product = await prisma.product.findFirst({ where: { id: item.productId, deletedAt: null } });
      if (!product) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Product ${item.productId} not found.` } });

      const rate = product.baseRentalRate ? Number(product.baseRentalRate) : 0;
      const deposit = product.securityDeposit ? Number(product.securityDeposit) : 0;

      // Find an available physical unit
      const units = await prisma.inventoryUnit.findMany({
        where: {
          productId: item.productId,
          status: { in: [InventoryStatus.available, InventoryStatus.reserved] }
        }
      });

      let assignedUnitId: string | null = null;
      for (const unit of units) {
        const overlaps = await prisma.rentalOrderItem.findFirst({
          where: {
            inventoryUnitId: unit.id,
            returnedAt: null,
            rentalOrder: {
              status: { notIn: [RentalOrderStatus.cancelled, RentalOrderStatus.returned] }
            },
            OR: [
              { startDate: { lte: end }, endDate: { gte: start } }
            ]
          }
        });
        if (!overlaps) {
          assignedUnitId = unit.id;
          break;
        }
      }

      if (!assignedUnitId) {
        return res.status(409).json({
          success: false,
          error: { code: 'UNAVAILABLE', message: `No active serial units available for ${product.name} inside selected dates.` }
        });
      }

      totalAmount += rate * days;
      totalDeposit += deposit;

      reservedItems.push({
        productId: item.productId,
        inventoryUnitId: assignedUnitId,
        startDate: start,
        endDate: end,
        rentalRate: rate,
        securityDeposit: deposit
      });
    }

    const verificationCode = generateCode();

    // Execute order creation inside database transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.rentalOrder.create({
        data: {
          customerId,
          totalAmount,
          depositAmount: totalDeposit,
          status: RentalOrderStatus.pending_payment,
          pickupSlot: new Date(pickupSlot),
          pickupVerificationCode: verificationCode
        }
      });

      for (const item of reservedItems) {
        await tx.rentalOrderItem.create({
          data: {
            rentalOrderId: newOrder.id,
            productId: item.productId,
            inventoryUnitId: item.inventoryUnitId,
            startDate: item.startDate,
            endDate: item.endDate,
            rentalRate: item.rentalRate,
            securityDeposit: item.securityDeposit
          }
        });

        // Set status to reserved
        await tx.inventoryUnit.update({
          where: { id: item.inventoryUnitId },
          data: { status: InventoryStatus.reserved }
        });

        // Log reservation history
        await tx.rentalHistory.create({
          data: {
            inventoryUnitId: item.inventoryUnitId,
            eventType: 'reserved',
            eventDetails: `Item code reserved for Rental Order #${newOrder.id}`
          }
        });
      }

      // Add mock agreement PDF link
      const updatedOrder = await tx.rentalOrder.update({
        where: { id: newOrder.id },
        data: { digitalAgreementUrl: `https://sportnest-agreements.s3.amazonaws.com/agreement-${newOrder.id}.pdf` },
        include: { items: { include: { product: { select: { name: true } } } } }
      });

      return updatedOrder;
    });

    return res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to checkout rental reservation.' } });
  }
}

export async function confirmPayment(req: Request, res: Response) {
  try {
    const parse = paymentSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { rentalOrderId, paymentMethod, transactionId } = parse.data;

    const order = await prisma.rentalOrder.findUnique({ where: { id: rentalOrderId } });
    if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });

    await prisma.$transaction([
      prisma.rentalOrder.update({
        where: { id: rentalOrderId },
        data: { status: RentalOrderStatus.reserved }
      }),
      prisma.rentalPayment.create({
        data: {
          rentalOrderId,
          amount: order.totalAmount,
          paymentMethod,
          transactionId,
          status: 'success'
        }
      })
    ]);

    return res.status(200).json({ success: true, data: { message: 'Payment successfully captured.' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed capturing rental payment.' } });
  }
}

export async function verifyPickup(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = verifyPickupSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { verificationCode, conditionScore, notes } = parse.data;
    const inspectorId = req.user?.sub;

    if (!inspectorId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired.' } });

    const order = await prisma.rentalOrder.findFirst({
      where: {
        pickupVerificationCode: verificationCode,
        status: { in: [RentalOrderStatus.reserved, RentalOrderStatus.pending_payment] }
      },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No pending rental order found matching code.' } });
    }

    await prisma.$transaction(async (tx) => {
      // Update order status to active
      await tx.rentalOrder.update({
        where: { id: order.id },
        data: { status: RentalOrderStatus.active }
      });

      for (const item of order.items) {
        if (!item.inventoryUnitId) continue;

        // Perform pickup inspection
        await tx.rentalInspection.create({
          data: {
            rentalOrderItemId: item.id,
            inspectorId,
            type: RentalInspectionType.pickup,
            conditionScore,
            notes: notes || 'Verified okay at pick-up counter.'
          }
        });

        // Set status to rented
        await tx.inventoryUnit.update({
          where: { id: item.inventoryUnitId },
          data: {
            status: InventoryStatus.rented,
            condition: conditionScore
          }
        });

        // Log history timeline
        await tx.rentalHistory.create({
          data: {
            inventoryUnitId: item.inventoryUnitId,
            eventType: 'rented',
            eventDetails: `Item hand-off verified by staff. Active rental under Order #${order.id}`
          }
        });
      }
    });

    return res.status(200).json({ success: true, data: { message: 'Pickup processed successfully. Rental active.' } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed checking out physical units.' } });
  }
}

export async function verifyReturn(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = verifyReturnSchema.safeParse(req.body);
    if (!parse.success) return res.status(422).json({ success: false, error: { code: 'VALIDATION_FAILED', details: parse.error.format() } });

    const { inventoryCode, conditionScore, notes, isDamaged } = parse.data;
    const inspectorId = req.user?.sub;

    if (!inspectorId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired.' } });

    // Retrieve active item matching unit code
    const item = await prisma.rentalOrderItem.findFirst({
      where: {
        returnedAt: null,
        inventoryUnit: { inventoryCode },
        rentalOrder: { status: { in: [RentalOrderStatus.active, RentalOrderStatus.overdue] } }
      },
      include: { rentalOrder: true }
    });

    if (!item || !item.inventoryUnitId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No active rental item found matching unit code.' } });
    }

    const today = new Date();
    let penaltyAmount = 0;
    let returnRemarks = notes || 'Returned to warehouse.';

    await prisma.$transaction(async (tx) => {
      // 1. Calculate late penalties if today is past item's endDate
      if (today > item.endDate) {
        const daysLate = calculateDays(item.endDate, today);
        penaltyAmount = daysLate * Number(item.rentalRate) * 1.5; // daily penalty surcharge

        await tx.rentalPenalty.create({
          data: {
            rentalOrderItemId: item.id,
            amount: penaltyAmount,
            reason: 'late',
            status: 'unpaid'
          }
        });
        returnRemarks += ` (Returned late by ${daysLate} days. Surcharge: $${penaltyAmount})`;
      }

      // 2. Damage penalty
      if (isDamaged) {
        const damageSurcharge = Number(item.securityDeposit) * 0.5; // lock portion of deposit
        await tx.rentalPenalty.create({
          data: {
            rentalOrderItemId: item.id,
            amount: damageSurcharge,
            reason: 'damage',
            status: 'unpaid'
          }
        });
        returnRemarks += ` (Item damaged. Deposit lock: $${damageSurcharge})`;
      }

      // 3. Save Inspection details
      await tx.rentalInspection.create({
        data: {
          rentalOrderItemId: item.id,
          inspectorId,
          type: RentalInspectionType.return,
          conditionScore,
          notes: returnRemarks
        }
      });

      // 4. Update unit status
      const nextStatus = isDamaged ? InventoryStatus.damaged : InventoryStatus.available;
      await tx.inventoryUnit.update({
        where: { id: item.inventoryUnitId! },
        data: {
          status: nextStatus,
          condition: conditionScore,
          remarks: returnRemarks,
          availability: !isDamaged
        }
      });

      // 5. Save history
      await tx.rentalHistory.create({
        data: {
          inventoryUnitId: item.inventoryUnitId!,
          eventType: isDamaged ? 'damaged' : 'returned',
          eventDetails: `Item return processed. Status: ${nextStatus}. Notes: ${returnRemarks}`
        }
      });

      // 6. Set returned date
      await tx.rentalOrderItem.update({
        where: { id: item.id },
        data: { returnedAt: today }
      });

      // 7. Check if parent order is completely returned
      const remainingItems = await tx.rentalOrderItem.count({
        where: {
          rentalOrderId: item.rentalOrderId,
          returnedAt: null
        }
      });

      if (remainingItems === 0) {
        await tx.rentalOrder.update({
          where: { id: item.rentalOrderId },
          data: { status: RentalOrderStatus.returned }
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Return recorded successfully.',
        penalties: penaltyAmount,
        damageRecorded: isDamaged
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed checking in physical unit.' } });
  }
}

export async function listRentalOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const customerId = req.query.customerId as string;
    const status = req.query.status as RentalOrderStatus;

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    // Customers can only see their own rentals
    if (req.user?.role === 'customer' || req.user?.role === 'guest') {
      where.customerId = req.user.sub;
    }

    const [orders, total] = await prisma.$transaction([
      prisma.rentalOrder.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          items: {
            include: {
              product: { select: { name: true } },
              inventoryUnit: { select: { inventoryCode: true } },
              inspections: true,
              penalties: true
            }
          },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.rentalOrder.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed querying rental logs.' } });
  }
}

export async function getTimelineHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const { unitId } = req.params;

    const history = await prisma.rentalHistory.findMany({
      where: { inventoryUnitId: unitId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed fetching timeline events.' } });
  }
}
