import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { isValidIranPhone, normalizeIranPhone } from "@/lib/phone";
import type { Role } from "@prisma/client";

const credentialsSchema = z.object({
  phone: z.string().min(10),
  code: z.string().min(4),
});

const OTP_DEV_MODE = process.env.OTP_DEV_MODE === "true";
const OTP_FIXED_CODE = process.env.OTP_FIXED_CODE ?? "11111";
const OTP_FORCE_FIXED = process.env.OTP_FORCE_FIXED !== "false";

function isMissingOtpTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: string }).message) : "";
  return message.includes("OtpCode") && message.includes("does not exist");
}

function isMissingPhoneColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: string }).message) : "";
  return message.toLowerCase().includes("phone") && message.toLowerCase().includes("does not exist");
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { phone, code } = parsed.data;
        const normalized = normalizeIranPhone(phone);
        if (!isValidIranPhone(normalized)) {
          return null;
        }

        // Temporary: accept fixed code without OTP table/provider.
        if (code === OTP_FIXED_CODE && (OTP_DEV_MODE || OTP_FORCE_FIXED)) {
          const fallbackEmail = `${normalized}@phone.local`;
          const fallbackPasswordHash = await bcrypt.hash(OTP_FIXED_CODE, 10);
          const user = await prisma.user.upsert({
            where: { email: fallbackEmail },
            update: {},
            create: {
              email: fallbackEmail,
              passwordHash: fallbackPasswordHash,
              role: "USER",
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: normalized,
            role: user.role,
          } satisfies {
            id: string;
            email: string | null;
            name: string | null;
            phone: string | null;
            role: Role;
          };
        }

        const ensureUser = async (normalizedPhone: string) => {
          const fallbackEmail = `${normalizedPhone}@phone.local`;
          const fallbackPasswordHash = await bcrypt.hash(OTP_FIXED_CODE, 10);

          try {
            let user = await prisma.user.findUnique({
              where: { phone: normalizedPhone },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
              },
            });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  phone: normalizedPhone,
                  email: fallbackEmail,
                  passwordHash: fallbackPasswordHash,
                  role: "USER",
                },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                  phone: true,
                },
              });
            }
            return user;
          } catch (error) {
            if (!isMissingPhoneColumn(error)) {
              throw error;
            }

            let user = await prisma.user.findUnique({
              where: { email: fallbackEmail },
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: fallbackEmail,
                  passwordHash: fallbackPasswordHash,
                  role: "USER",
                },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                },
              });
            }
            return { ...user, phone: null } as typeof user & { phone: string | null };
          }
        };

        if (!OTP_DEV_MODE && !OTP_FORCE_FIXED) {
          let otpRecord;
          try {
            otpRecord = await prisma.otpCode.findUnique({ where: { phone: normalized } });
          } catch (error) {
            if (isMissingOtpTable(error)) {
              return code === OTP_FIXED_CODE ? await ensureUser(normalized) : null;
            }
            throw error;
          }

          if (!otpRecord) {
            return null;
          }

          if (otpRecord.expiresAt < new Date() || otpRecord.attemptsLeft <= 0) {
            return null;
          }

          const isValid = await bcrypt.compare(code, otpRecord.codeHash);
          if (!isValid) {
            await prisma.otpCode.update({
              where: { phone: normalized },
              data: { attemptsLeft: { decrement: 1 } },
            });
            return null;
          }

          await prisma.otpCode.delete({ where: { phone: normalized } });
        } else if (code !== OTP_FIXED_CODE) {
          return null;
        }

        const user = await ensureUser(normalized);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        } satisfies {
          id: string;
          email: string | null;
          name: string | null;
          phone: string | null;
          role: Role;
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
        token.phone = (user as { phone?: string | null }).phone ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as Role) ?? "USER";
        session.user.phone = (token.phone as string | null) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
};
