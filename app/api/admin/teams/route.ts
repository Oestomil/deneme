import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getTeams, upsertTeam, deleteTeam } from "@/lib/kv";
import type { Team } from "@/lib/types";

export async function GET(req: NextRequest) {
    try {
        const authed = await isAuthenticated();
        if (!authed) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teams = await getTeams();
        return NextResponse.json({ teams });
    } catch (error) {
        console.error("Get teams error:", error);
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
        const { action, team, id } = body;

        if (action === "delete") {
            if (!id) {
                return NextResponse.json({ error: "ID required" }, { status: 400 });
            }
            await deleteTeam(id);
            return NextResponse.json({ success: true });
        }

        // Upsert
        if (!team || !team.id || !team.name || !team.shortName) {
            return NextResponse.json(
                { error: "Invalid team data" },
                { status: 400 }
            );
        }

        const teamData: Team = {
            id: team.id,
            name: team.name,
            shortName: team.shortName,
            logoUrl: team.logoUrl || "",
            updatedAt: Date.now(),
        };

        await upsertTeam(teamData);
        return NextResponse.json({ success: true, team: teamData });
    } catch (error) {
        console.error("Team operation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
