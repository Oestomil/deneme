// Data types for KV storage

export type Team = {
    id: string;            // "gs"
    name: string;          // "Galatasaray"
    shortName: string;     // "GS"
    logoUrl: string;       // Blob public URL
    updatedAt: number;
};

export type MatchStatus = "draft" | "published" | "archived";

export type Match = {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    league: string;
    kickoffAt: string;     // ISO date string
    status: MatchStatus;
    aiText?: string | null;
    stadium?: string;
    week?: number; // week number, e.g. 1, 2, 3...
    createdAt: number;
    updatedAt: number;
};

export type DailySet = {
    dateKey: string;       // "YYYY-MM-DD"
    matchIds: string[];
    published: boolean;
    updatedAt: number;
};

export type ResultPick = "1" | "X" | "2";
export type OUPick = "over" | "under";

export type UserPrediction = {
    matchId: string;
    resultPick?: ResultPick;
    ouPick?: OUPick;
    completedAt?: number;
};

export type UserState = {
    deviceId: string;
    tokens: number;
    predictions: Record<string, Record<string, UserPrediction>>; // dateKey -> matchId -> Prediction
    unlockedMatchIds: string[];
    createdAt: number;
    updatedAt: number;
};

// API response types

export type DailyMatchesResponse = {
    dateKey: string;
    matches: Array<{
        id: string;
        league: string;
        kickoffAt: string;
        homeTeam: {
            id: string;
            name: string;
            shortName: string;
            logoUrl: string;
        };
        awayTeam: {
            id: string;
            name: string;
            shortName: string;
            logoUrl: string;
        };
        aiText?: string | null;
        stadium?: string;
    }>;
};

export type UserStateResponse = {
    tokens: number;
    answeredCount: number;
    unlockedMatchIds: string[];
};
