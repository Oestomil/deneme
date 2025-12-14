import { NextRequest, NextResponse } from "next/server";
import { getDailySet, getAllDailySets, getMatch, getTeamById } from "@/lib/kv";
import type { DailyMatchesResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let dateKey = searchParams.get("dateKey") || "latest";

        // Get daily set
        let dailySet: any = null;

        if (dateKey !== "latest") {
            dailySet = await getDailySet(dateKey);
        }

        // Fallback or "latest" logic
        if (!dailySet || !dailySet.published) {
            const allSets = await getAllDailySets();
            const publishedSets = allSets
                .filter(s => s.published && s.dateKey.startsWith('week-'))
                .sort((a, b) => {
                    // Extract week number: "week-5" -> 5
                    const weekA = parseInt(a.dateKey.split('-')[1]);
                    const weekB = parseInt(b.dateKey.split('-')[1]);
                    return weekB - weekA; // Descending
                });

            if (publishedSets.length > 0) {
                dailySet = publishedSets[0];
                // Update dateKey to the actual found key so the client knows what it got
                if (dateKey === "latest") {
                    dateKey = dailySet.dateKey;
                }
            }
        }

        if (!dailySet || !dailySet.published) {
            return NextResponse.json(
                { error: "No published daily set found" },
                { status: 404 }
            );
        }

        // Fetch all matches and teams
        const matchPromises = dailySet.matchIds.map((id: string) => getMatch(id));
        const matches = await Promise.all(matchPromises);

        // Build response with joined team data
        const responseMatches = await Promise.all(
            matches.map(async (match) => {
                if (!match) return null;

                const homeTeam = await getTeamById(match.homeTeamId);
                const awayTeam = await getTeamById(match.awayTeamId);

                if (!homeTeam || !awayTeam) return null;

                return {
                    id: match.id,
                    league: match.league,
                    kickoffAt: match.kickoffAt,
                    homeTeam: {
                        id: homeTeam.id,
                        name: homeTeam.name,
                        shortName: homeTeam.shortName,
                        logoUrl: homeTeam.logoUrl,
                    },
                    awayTeam: {
                        id: awayTeam.id,
                        name: awayTeam.name,
                        shortName: awayTeam.shortName,
                        logoUrl: awayTeam.logoUrl,
                    },
                    aiText: match.aiText,
                    stadium: match.stadium,
                };
            })
        );

        // Filter out nulls
        const validMatches = responseMatches.filter((m) => m !== null);

        const response: DailyMatchesResponse = {
            dateKey,
            matches: validMatches,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Get daily matches error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
