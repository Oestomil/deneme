import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getDailySet, upsertDailySet, getAllDailySets } from "@/lib/kv";
import type { DailySet } from "@/lib/types";

export async function GET(req: NextRequest) {
    try {
        const authed = await isAuthenticated();
        if (!authed) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const dateKey = searchParams.get("dateKey");

        if (dateKey) {
            const dailySet = await getDailySet(dateKey);
            return NextResponse.json({ dailySet });
        }

        // Get all daily sets
        const dailySets = await getAllDailySets();
        return NextResponse.json({ dailySets });
    } catch (error) {
        console.error("Get daily sets error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const authed = await isAuthenticated();
        if (!authed) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { dateKey, matchIds, published, exclusive } = body;

        if (!dateKey || !Array.isArray(matchIds)) {
            return NextResponse.json(
                { error: "Invalid daily set data" },
                { status: 400 }
            );
        }

        // If exclusive publish requested, unpublish all others
        console.log("Exclusive Publish Check:", { exclusive, published, dateKey });
        if (exclusive && published) {
            const allSets = await getAllDailySets();
            console.log("Found sets:", allSets.length);
            for (const set of allSets) {
                console.log("Checking set:", set.dateKey, set.published);
                if (set.dateKey !== dateKey && set.published) {
                    console.log("Unpublishing:", set.dateKey);
                    await upsertDailySet({
                        ...set,
                        published: false
                    });
                }
            }
        }

        const dailySet: DailySet = {
            dateKey,
            matchIds,
            published: published ?? false,
            updatedAt: Date.now(),
        };

        await upsertDailySet(dailySet);
        return NextResponse.json({ success: true, dailySet });
    } catch (error) {
        console.error("Daily set operation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
