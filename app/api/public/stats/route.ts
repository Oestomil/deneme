import { NextRequest, NextResponse } from "next/server";
import { getMatchStats, getDailySet } from "@/lib/kv";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateKey = searchParams.get("dateKey");

        if (!dateKey) {
            return NextResponse.json(
                { error: "dateKey parameter required" },
                { status: 400 }
            );
        }

        const dailySet = await getDailySet(dateKey);
        if (!dailySet) {
            return NextResponse.json({ stats: {} });
        }

        const statsMap: Record<string, any> = {};

        await Promise.all(
            dailySet.matchIds.map(async (matchId) => {
                const stats = await getMatchStats(matchId);
                statsMap[matchId] = stats;
            })
        );

        return NextResponse.json({ stats: statsMap });
    } catch (error) {
        console.error("Get stats error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
