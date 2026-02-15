import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { isValidIranPhone, normalizeIranPhone } from "@/lib/phone";
import { sendOtp, MeliPayamakError } from "@/lib/integrations/melipayamak";

const requestSchema = z.object({
  phone: z.string().min(5),
});

const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS ?? 300);
const OTP_COOLDOWN_SECONDS = Number(process.env.OTP_COOLDOWN_SECONDS ?? 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
const OTP_DEV_MODE = process.env.OTP_DEV_MODE === "true";
const OTP_FIXED_CODE = process.env.OTP_FIXED_CODE ?? "11111";
const OTP_FORCE_FIXED = process.env.OTP_FORCE_FIXED !== "false";

function generateOtpCode() {
  return Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
}

function isMissingOtpTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: string }).message) : "";
  return message.includes("OtpCode") && message.includes("does not exist");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = requestSchema.parse(body);
    const normalized = normalizeIranPhone(phone);

    if (!isValidIranPhone(normalized)) {
      return NextResponse.json({ error: "شماره موبایل نامعتبر است." }, { status: 400 });
    }

    // Temporary: return fixed code without hitting DB/provider.
    if (OTP_DEV_MODE || OTP_FORCE_FIXED) {
      return NextResponse.json({
        sent: true,
        provider: "dev",
        requestId: "DEV",
        expiresIn: OTP_TTL_SECONDS,
        cooldown: OTP_COOLDOWN_SECONDS,
        devCode: OTP_FIXED_CODE,
      });
    }

    const now = new Date();
    let existing: Awaited<ReturnType<typeof prisma.otpCode.findUnique>> | null = null;
    try {
      existing = await prisma.otpCode.findUnique({ where: { phone: normalized } });
    } catch (error) {
      if (isMissingOtpTable(error)) {
        return NextResponse.json({
          sent: true,
          provider: "dev",
          requestId: "DEV",
          expiresIn: OTP_TTL_SECONDS,
          cooldown: OTP_COOLDOWN_SECONDS,
          devCode: OTP_FIXED_CODE,
        });
      }
      throw error;
    }
    if (existing) {
      const diffSeconds = (now.getTime() - existing.lastSentAt.getTime()) / 1000;
      if (diffSeconds < OTP_COOLDOWN_SECONDS) {
        return NextResponse.json({ error: "لطفاً کمی بعد دوباره تلاش کنید." }, { status: 429 });
      }
    }

    let code = OTP_DEV_MODE ? OTP_FIXED_CODE : generateOtpCode();
    let provider = "dev";
    let requestId = "DEV";

    if (!OTP_DEV_MODE) {
      try {
        const res = await sendOtp(normalized);
        code = res.code;
        requestId = res.requestId;
        provider = "melipayamak";
      } catch (error) {
        if (error instanceof MeliPayamakError) {
          return NextResponse.json({ error: error.message }, { status: 502 });
        }
        throw error;
      }
    }

    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);

    await prisma.otpCode.upsert({
      where: { phone: normalized },
      update: {
        codeHash,
        expiresAt,
        attemptsLeft: OTP_MAX_ATTEMPTS,
        lastSentAt: now,
      },
      create: {
        phone: normalized,
        codeHash,
        expiresAt,
        attemptsLeft: OTP_MAX_ATTEMPTS,
        lastSentAt: now,
      },
    });

    return NextResponse.json({
      sent: true,
      provider,
      requestId,
      expiresIn: OTP_TTL_SECONDS,
      cooldown: OTP_COOLDOWN_SECONDS,
      ...(OTP_DEV_MODE ? { devCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "ورودی نامعتبر است." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("OTP request error:", message);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
