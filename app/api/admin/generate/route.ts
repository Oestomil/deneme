import { NextRequest, NextResponse } from "next/server";
import { getTeams, upsertMatch, upsertDailySet, getDailySet } from "@/lib/kv";
import type { Match } from "@/lib/types";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { week, count } = body;

        if (!week || !count) {
            return NextResponse.json(
                { error: "Week and count required" },
                { status: 400 }
            );
        }

        const teams = await getTeams();
        if (teams.length < 2) {
            return NextResponse.json(
                { error: "Not enough teams to generate matches" },
                { status: 400 }
            );
        }

        const matchIds: string[] = [];
        // Determine kickoff time (e.g. tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(20, 0, 0, 0);

        for (let i = 0; i < count; i++) {
            // Pick two distinct random teams
            let homeIdx = Math.floor(Math.random() * teams.length);
            let awayIdx = Math.floor(Math.random() * teams.length);

            while (awayIdx === homeIdx) {
                awayIdx = Math.floor(Math.random() * teams.length);
            }

            const homeTeam = teams[homeIdx];
            const awayTeam = teams[awayIdx];

            const match = await upsertMatch({
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                league: "Test League",
                kickoffAt: tomorrow.toISOString(),
                status: "published",
                week,
                stadium: "Random Stadium"
            });
            matchIds.push(match.id);
        }

        // Upsert daily set
        const dateKey = `week-${week}`;
        const existingSet = await getDailySet(dateKey);

        await upsertDailySet({
            dateKey,
            matchIds: existingSet ? [...existingSet.matchIds, ...matchIds] : matchIds,
            published: true,
            updatedAt: Date.now()
        });

        return NextResponse.json({ success: true, count: matchIds.length });
    } catch (error) {
        console.error("Generate matches error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
