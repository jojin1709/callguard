import { prisma } from "@/lib/prisma";

export async function requireAdmin(req?: Request): Promise<{ authorized: boolean; error?: string }> {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return { authorized: false, error: "Admin not configured." };
  }

  // Check for admin secret in request header or cookie
  let providedSecret: string | null = null;

  if (req) {
    providedSecret = req.headers.get("x-admin-secret");
    if (!providedSecret) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/admin_secret=([^;]+)/);
        if (match) providedSecret = decodeURIComponent(match[1]);
      }
    }
  }

  if (!providedSecret || providedSecret !== adminSecret) {
    return { authorized: false, error: "Invalid admin secret." };
  }

  return { authorized: true };
}
