import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  phoneNumber: z.string().min(7),
  address: z.string().min(5),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const medicineSchema = z.object({
  name: z.string().trim().min(2).max(160),
  genericName: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5000),
  categoryId: z.uuid().nullable().optional(),
  price: z.coerce
    .number()
    .finite()
    .positive()
    .max(9_999_999_999.99)
    .refine((price) => Math.abs(price * 100 - Math.round(price * 100)) < 1e-7, "Price must use at most two decimal places."),
  quantityInStock: z.coerce.number().int().min(0).max(2_147_483_647),
  dosage: z.string().trim().min(2).max(500),
  manufacturer: z.string().trim().min(2).max(200),
  image: z.string().trim().min(1).max(2048),
  expiryDate: z.coerce.date(),
  requiresPrescription: z.coerce.boolean().default(false),
  isAvailable: z.coerce.boolean().default(true),
});

const optionalQueryNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().finite().nonnegative().optional(),
);

export const medicineListQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    category: z.union([z.uuid(), z.literal("")]).optional(),
    availability: z.union([z.enum(["in-stock", "out-of-stock"]), z.literal("")]).optional(),
    minPrice: optionalQueryNumber,
    maxPrice: optionalQueryNumber,
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine(
    ({ minPrice, maxPrice }) => minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: "Minimum price cannot exceed maximum price." },
  );

export const medicineIdSchema = z.uuid();

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  isActive: z.coerce.boolean().default(true),
});

export const checkoutSchema = z.object({
  deliveryAddress: z.string().trim().min(5).max(500),
  phoneNumber: z.string().trim().min(7).max(30),
  paymentStatus: z.enum(["Pending", "Paid", "Failed"]).default("Pending"),
  items: z.array(
    z.object({
      medicineId: z.string().uuid(),
      quantity: z.number().int().min(1),
    }),
  ).min(1).superRefine((items, ctx) => {
    const medicineIds = new Set<string>();
    items.forEach((item, index) => {
      if (medicineIds.has(item.medicineId)) {
        ctx.addIssue({
          code: "custom",
          message: "A medicine can only appear once in an order.",
          path: [index, "medicineId"],
        });
      }
      medicineIds.add(item.medicineId);
    });
  }),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(["Pending", "Confirmed", "Processing", "Ready for Delivery", "Out for Delivery", "Delivered", "Cancelled"]),
});

export const profileSchema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().min(7),
  address: z.string().min(5),
});
