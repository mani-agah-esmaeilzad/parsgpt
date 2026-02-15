import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await request.json().catch(() => ({}));
  return NextResponse.json(
    { error: "این مسیر غیرفعال است. برای ثبت‌نام از ورود با کد تایید استفاده کنید." },
    { status: 410 },
  );
}
