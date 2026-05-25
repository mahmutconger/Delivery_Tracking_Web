import { NextResponse } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import {
  setDriverActive,
  updateDriverPhone,
} from "@/features/drivers/application/get-driver-data";

const patchSchema = z.object({
  active: z.boolean().optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Geçerli bir telefon numarası girin (+905xxxxxxxxx)")
    .nullable()
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ driverId: string }> },
) {
  try {
    await requireSession(["admin"]);
    const { driverId } = await context.params;
    const body = patchSchema.parse(await request.json());

    if (body.active !== undefined) {
      await setDriverActive(driverId, body.active);
    }
    if (body.phoneNumber !== undefined) {
      await updateDriverPhone(driverId, body.phoneNumber);
    }

    return ok({ driverId });
  } catch (error) {
    return fail(error);
  }
}

// Form POST — used by active/inactive toggle button
export async function POST(
  request: Request,
  context: { params: Promise<{ driverId: string }> },
) {
  try {
    await requireSession(["admin"]);
    const { driverId } = await context.params;
    const formData = await request.formData();

    const activeRaw = formData.get("active");
    const phoneRaw = formData.get("phoneNumber");

    if (activeRaw !== null) {
      await setDriverActive(driverId, String(activeRaw) === "true");
    }
    if (phoneRaw !== null) {
      const phone = String(phoneRaw).trim();
      await updateDriverPhone(driverId, phone.length > 0 ? phone : null);
    }

    return NextResponse.redirect(new URL(`/drivers/${driverId}`, request.url));
  } catch (error) {
    return fail(error);
  }
}
