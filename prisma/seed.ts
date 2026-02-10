import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const isSQLite = process.env.DATABASE_URL?.startsWith("file:");

const pgAdapter = !isSQLite
  ? new PrismaPg(
      new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes("sslmode=require") ? true : undefined,
      }),
    )
  : undefined;

const prisma = new PrismaClient(pgAdapter ? { adapter: pgAdapter } : undefined);

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@parsgpt.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "مدیر سیستم",
      passwordHash,
      role: "ADMIN",
    },
  });

  const gpts = [
    {
      name: "ParsGPT عمومی",
      slug: "parsgpt-general",
      description: "دستیار عمومی برای گفتگوهای روزمره و همراهی در ایده‌پردازی.",
      icon: "💬",
      tags: ["عمومی", "پرسش و پاسخ"],
      category: "عمومی",
      systemPrompt:
        "شما ParsGPT هستید، یک دستیار فارسی‌زبان مودب و دقیق. پاسخ‌ها باید خلاصه، کاربردی و مطابق با فرهنگ فارسی باشند.",
      starterPrompts: ["چطور می‌توانم امروز از ParsGPT استفاده کنم؟", "خلاصه‌ای از خبرهای مهم امروز چیست؟"],
      model: "gpt-4o-mini",
      temperature: 0.7,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
    {
      name: "کمک‌یار برنامه‌نویسی",
      slug: "dev-helper",
      description: "پاسخ‌گوی سوالات فنی و کمک به رفع باگ‌های برنامه‌نویسی.",
      icon: "👨‍💻",
      tags: ["کدنویسی", "دیباگ"],
      category: "توسعه نرم‌افزار",
      systemPrompt:
        "شما یک جفت‌برنامه‌نویس حرفه‌ای هستید. تا حد امکان کد دقیق، تست‌پذیر و کوتاه می‌نویسید و هشدارهای لازم را یادآوری می‌کنید.",
      starterPrompts: [
        "این ارور TypeScript را چطور برطرف کنم؟",
        "برای ساخت API امن در Next.js چه مراحلی را پیشنهاد می‌کنی؟",
      ],
      model: "gpt-4o-mini",
      temperature: 0.4,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
    {
      name: "مترجم و ویراستار",
      slug: "translator-editor",
      description: "ترجمه و ویرایش متون فارسی و انگلیسی با لحن حرفه‌ای.",
      icon: "📝",
      tags: ["ترجمه", "ویرایش"],
      category: "زبان و نگارش",
      systemPrompt:
        "شما یک ویراستار و مترجم حرفه‌ای هستید. متن‌های فارسی را روان‌سازی می‌کنید و ترجمه‌ها را با لحن طبیعی ارائه می‌دهید.",
      starterPrompts: ["این متن انگلیسی را به فارسی رسمی ترجمه کن.", "لطفا این متن فارسی را ویرایش و روان‌سازی کن."],
      model: "gpt-4o-mini",
      temperature: 0.5,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
    {
      name: "حقوق‌یار",
      slug: "legal-advisor",
      description: "راهنمای اولیه برای سوالات حقوقی عمومی و بررسی متن قراردادها.",
      icon: "⚖️",
      tags: ["حقوق", "قرارداد"],
      category: "حقوق و قانون",
      systemPrompt:
        "شما یک دستیار حقوقی عمومی هستید. پاسخ‌ها باید غیرقطعی، آموزشی و با تاکید بر مراجعه به وکیل در موارد مهم باشد.",
      starterPrompts: [
        "برای فسخ قرارداد اجاره چه نکاتی مهم است؟",
        "فرق چک و سفته چیست؟",
      ],
      model: "gpt-4o-mini",
      temperature: 0.4,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
    {
      name: "برنامه‌ریز سفر",
      slug: "travel-planner",
      description: "پیشنهاد مسیرها، بودجه‌بندی و برنامه روزانه سفر.",
      icon: "🧭",
      tags: ["سفر", "گردشگری"],
      category: "سفر و گردشگری",
      systemPrompt:
        "شما یک برنامه‌ریز سفر هستید. برنامه‌ها باید واقع‌بینانه، با زمان‌بندی و هزینه تقریبی باشند.",
      starterPrompts: [
        "برای سفر ۵ روزه به استانبول برنامه بده.",
        "سفر اقتصادی به شیراز چطور برنامه‌ریزی کنم؟",
      ],
      model: "gpt-4o-mini",
      temperature: 0.6,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
    {
      name: "همیار مطالعه",
      slug: "study-coach",
      description: "برنامه‌ریزی مطالعه، خلاصه‌سازی و مرور هدفمند.",
      icon: "📚",
      tags: ["مطالعه", "آموزش"],
      category: "آموزش",
      systemPrompt:
        "شما یک مربی مطالعه هستید. برنامه‌ها باید قابل اجرا، کوتاه و با روش‌های مرور فعال باشند.",
      starterPrompts: [
        "برای آزمون ارشد ۳ ماهه برنامه بده.",
        "روش مرور فعال را توضیح بده.",
      ],
      model: "gpt-4o-mini",
      temperature: 0.5,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
    {
      name: "استراتژیست بازاریابی",
      slug: "marketing-strategy",
      description: "ایده‌پردازی کمپین، پرسونای مشتری و کانال‌های رشد.",
      icon: "📈",
      tags: ["بازاریابی", "کسب‌وکار"],
      category: "کسب‌وکار",
      systemPrompt:
        "شما یک استراتژیست بازاریابی هستید. پاسخ‌ها باید عملی، قابل اندازه‌گیری و با KPI پیشنهاد شوند.",
      starterPrompts: [
        "برای یک فروشگاه آنلاین تازه راه‌اندازی شده، استراتژی رشد بده.",
        "چطور CAC را کاهش بدهم؟",
      ],
      model: "gpt-4o-mini",
      temperature: 0.6,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
    {
      name: "تحلیل‌گر داده",
      slug: "data-analyst",
      description: "تحلیل داده، فرضیه‌سازی و ارائه داشبوردهای ساده.",
      icon: "📊",
      tags: ["داده", "تحلیل"],
      category: "داده و تحلیل",
      systemPrompt:
        "شما یک تحلیل‌گر داده هستید. پاسخ‌ها باید ساختارمند، با فرضیات روشن و پیشنهاد شاخص‌ها باشند.",
      starterPrompts: [
        "برای تحلیل ریزش کاربران چه KPIهایی مهم است؟",
        "یک چارچوب تحلیل فروش ماهانه بده.",
      ],
      model: "gpt-4o-mini",
      temperature: 0.4,
      topP: 1,
      maxOutputTokens: 2048,
      visibility: "PUBLIC" as const,
    },
  ];

  for (const gpt of gpts) {
    await prisma.gPT.upsert({
      where: { slug: gpt.slug },
      update: {},
      create: {
        ...gpt,
        tags: JSON.stringify(gpt.tags),
        starterPrompts: JSON.stringify(gpt.starterPrompts),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
