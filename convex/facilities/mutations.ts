import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const createFacility = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("hospital"),
      v.literal("clinic"),
      v.literal("health_center"),
      v.literal("specialized_clinic"),
    ),
    registrationNumber: v.string(),
    address: v.string(),
    city: v.string(),
    county: v.string(),
    phone: v.string(),
    email: v.string(),
    website: v.optional(v.string()),
    services: v.array(v.string()),
    departments: v.array(v.string()),
    bedCapacity: v.optional(v.number()),
    emergencyServices: v.boolean(),
    operatingHours: v.string(),
    accreditation: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending"),
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check if facility already exists
    const existing = await ctx.db
      .query("facilities")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      return {
        success: true,
        facilityId: existing._id,
        message: "Facility already exists",
      };
    }

    const facilityId = await ctx.db.insert("facilities", {
      name: args.name,
      type: args.type,
      registrationNumber: args.registrationNumber,
      address: args.address,
      city: args.city,
      county: args.county,
      phone: args.phone,
      email: args.email,
      website: args.website,
      services: args.services,
      departments: args.departments,
      bedCapacity: args.bedCapacity,
      emergencyServices: args.emergencyServices,
      operatingHours: args.operatingHours,
      accreditation: args.accreditation,
      status: args.status,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    return {
      success: true,
      facilityId,
      message: "Facility created successfully",
    };
  },
});

export const updateFacility = mutation({
  args: {
    facilityId: v.id("facilities"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    county: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    services: v.optional(v.array(v.string())),
    departments: v.optional(v.array(v.string())),
    bedCapacity: v.optional(v.number()),
    emergencyServices: v.optional(v.boolean()),
    operatingHours: v.optional(v.string()),
    accreditation: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("pending")),
    ),
  },
  handler: async (ctx, args) => {
    const { facilityId, ...updates } = args;

    // Create an update object with proper types
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    // Only add fields that are provided
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.county !== undefined) updateData.county = updates.county;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.services !== undefined) updateData.services = updates.services;
    if (updates.departments !== undefined)
      updateData.departments = updates.departments;
    if (updates.bedCapacity !== undefined)
      updateData.bedCapacity = updates.bedCapacity;
    if (updates.emergencyServices !== undefined)
      updateData.emergencyServices = updates.emergencyServices;
    if (updates.operatingHours !== undefined)
      updateData.operatingHours = updates.operatingHours;
    if (updates.accreditation !== undefined)
      updateData.accreditation = updates.accreditation;
    if (updates.status !== undefined) updateData.status = updates.status;

    await ctx.db.patch(facilityId, updateData);

    return { success: true };
  },
});
