import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getAllMatches, upsertMatch, deleteMatch } from "@/lib/kv";
import type { Match } from "@/lib/types";

export async function GET(req: NextRequest) {
    try {
        const authed = await isAuthenticated();
        if (!authed) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const matches = await getAllMatches();
        return NextResponse.json({ matches });
    } catch (error) {
        console.error("Get matches error:", error);
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
        const { action, match, id } = body;

        if (action === "delete") {
            if (!id) {
                return NextResponse.json({ error: "ID required" }, { status: 400 });
            }
            await deleteMatch(id);
            return NextResponse.json({ success: true });
        }

        // Upsert
        if (
            // !match || // match can be empty? no
            !match ||
            // !match.id || // ID is optional now for new matches
            !match.homeTeamId ||
            !match.awayTeamId ||
            !match.league ||
            !match.kickoffAt
        ) {
            return NextResponse.json(
                { error: "Invalid match data" },
                { status: 400 }
            );
        }

        const matchData: Partial<Match> = {
            id: match.id || undefined, // undefined triggers generation
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            league: match.league,
            kickoffAt: match.kickoffAt,
            status: match.status || "draft",
            aiText: match.aiText || null,
            stadium: match.stadium || null,
            week: match.week ? parseInt(match.week) : 1, // Default to week 1 if missing
            updatedAt: Date.now(),
        };

        const savedMatch = await upsertMatch(matchData);
        return NextResponse.json({ success: true, match: savedMatch });
    } catch (error) {
        console.error("Match operation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
