import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const target = searchParams.get("target");

        if (target === "matches") {
            // Delete matches, daily sets, and stats
            const matchKeys = await kv.keys('match:*');
            const dailyKeys = await kv.keys('daily:*');
            const statKeys = await kv.keys('match_stats:*');

            const keysToDelete = [...matchKeys, ...dailyKeys, ...statKeys];

            if (keysToDelete.length > 0) {
                await kv.del(...keysToDelete);
            }
            // Reset counter
            await kv.set("match_id_counter", 0);

            return NextResponse.json({ message: "Matches, Daily Sets, and Stats deleted" });
        }

        if (target === "all") {
            // Flush everything
            const keys = await kv.keys('*');
            if (keys.length > 0) {
                await kv.del(...keys);
            }
            await kv.set("match_id_counter", 0);
            return NextResponse.json({ message: "Full database flushed" });
        }

        return NextResponse.json({ error: "Invalid target. Use ?target=matches or ?target=all" }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: "Failed to flush DB", details: error }, { status: 500 });
    }
}
