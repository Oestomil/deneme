import { kv } from "@vercel/kv";
import type { Team, Match, DailySet, UserState } from "./types";

// ============= TEAMS =============

export async function getTeams(): Promise<Team[]> {
    const teams = await kv.get<Team[]>("teams");
    return teams || [];
}

export async function setTeams(teams: Team[]): Promise<void> {
    await kv.set("teams", teams);
}

export async function getTeamById(id: string): Promise<Team | null> {
    const teams = await getTeams();
    return teams.find((t) => t.id === id) || null;
}

export async function upsertTeam(team: Team): Promise<void> {
    const teams = await getTeams();
    const index = teams.findIndex((t) => t.id === team.id);

    if (index >= 0) {
        teams[index] = { ...team, updatedAt: Date.now() };
    } else {
        teams.push({ ...team, updatedAt: Date.now() });
    }

    await setTeams(teams);
}

export async function deleteTeam(id: string): Promise<void> {
    const teams = await getTeams();
    const filtered = teams.filter((t) => t.id !== id);
    await setTeams(filtered);
}

// ============= MATCHES =============

export async function getMatch(matchId: string): Promise<Match | null> {
    return await kv.get<Match>(`match:${matchId}`);
}

export async function getAllMatches(): Promise<Match[]> {
    // Get all match keys
    const keys = await kv.keys("match:*");
    if (keys.length === 0) return [];

    // Fetch all matches
    const matches = await Promise.all(
        keys.map((key) => kv.get<Match>(key))
    );

    return matches.filter((m): m is Match => m !== null);
}

// Helper to get next ID
async function getNextMatchId(): Promise<string> {
    const id = await kv.incr("match_id_counter");
    return id.toString();
}

export async function upsertMatch(matchData: Partial<Match>): Promise<Match> {
    // If no ID, generate sequential one
    if (!matchData.id) {
        matchData.id = await getNextMatchId();
    }

    const match: Match = {
        id: matchData.id,
        homeTeamId: matchData.homeTeamId!,
        awayTeamId: matchData.awayTeamId!,
        league: matchData.league!,
        kickoffAt: matchData.kickoffAt!,
        status: matchData.status || "draft",
        aiText: matchData.aiText || null,
        stadium: matchData.stadium,
        week: matchData.week || 1, // Default to 1 if not provided
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    // Need to handle partial updates vs full replace
    // For now, assume upsert provides all needed fields for new matches
    // But for edits, we might overwrite fields if we are not careful.
    // Let's fetch existing if we want to be safe, but the simplified version above
    // assumes matchData has everything for new matches.
    // For existing matches, we likely pass all fields anyway.

    // Let's keep existing logic structure but ensuring ID
    const existing = await getMatch(match.id);

    const updated: Match = {
        ...existing,
        ...match,
        // Ensure ID is set
        id: match.id,
        // Use existing createdAt if available
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
    };

    await kv.set(`match:${match.id}`, updated);
    return updated;
}

export async function deleteMatch(matchId: string): Promise<void> {
    // 1. Remove from all daily sets
    const dailySets = await getAllDailySets();
    for (const set of dailySets) {
        if (set.matchIds.includes(matchId)) {
            const updatedMatchIds = set.matchIds.filter((id) => id !== matchId);
            // Only update if changed
            if (updatedMatchIds.length !== set.matchIds.length) {
                await upsertDailySet({
                    ...set,
                    matchIds: updatedMatchIds,
                });
            }
        }
    }

    // 2. Delete the match itself
    await kv.del(`match:${matchId}`);
}

// ============= DAILY SETS =============

export async function getDailySet(dateKey: string): Promise<DailySet | null> {
    return await kv.get<DailySet>(`daily:${dateKey}`);
}

export async function upsertDailySet(dailySet: DailySet): Promise<void> {
    const updated: DailySet = {
        ...dailySet,
        updatedAt: Date.now(),
    };

    await kv.set(`daily:${dailySet.dateKey}`, updated);
}

export async function getAllDailySets(): Promise<DailySet[]> {
    const keys = await kv.keys("daily:*");
    if (keys.length === 0) return [];

    const sets = await Promise.all(
        keys.map((key) => kv.get<DailySet>(key))
    );

    return sets.filter((s): s is DailySet => s !== null);
}

// ============= USERS =============

export async function getUserState(deviceId: string): Promise<UserState | null> {
    return await kv.get<UserState>(`user:${deviceId}`);
}

export async function upsertUserState(userState: UserState): Promise<void> {
    const existing = await getUserState(userState.deviceId);

    const updated: UserState = {
        ...userState,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
    };

    await kv.set(`user:${userState.deviceId}`, updated);
}

// Helper: Initialize user if not exists
export async function initializeUser(deviceId: string): Promise<UserState> {
    const existing = await getUserState(deviceId);

    if (existing) return existing;

    const newUser: UserState = {
        deviceId,
        tokens: 0,
        predictions: {},
        unlockedMatchIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await upsertUserState(newUser);
    return newUser;
}

// ============= STATS =============

export type MatchStats = {
    "1"?: number;
    "X"?: number;
    "2"?: number;
    "over"?: number;
    "under"?: number;
}

export async function getMatchStats(matchId: string): Promise<MatchStats> {
    const stats = await kv.hgetall<MatchStats>(`match_stats:${matchId}`);
    return stats || {};
}

export async function incrementMatchStats(matchId: string, pick: string): Promise<void> {
    // Atomic increment
    await kv.hincrby(`match_stats:${matchId}`, pick, 1);
}
