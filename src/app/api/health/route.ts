import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Database health check failed:", error);
    return Response.json(
      { ok: false, message: "Database is unavailable. Check DATABASE_URL and PostgreSQL connectivity." },
      { status: 503 },
    );
  }
}
