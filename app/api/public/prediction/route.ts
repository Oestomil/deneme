import { NextRequest, NextResponse } from "next/server";
import { getUserState, upsertUserState, initializeUser, incrementMatchStats } from "@/lib/kv";
import type { ResultPick, OUPick, UserPrediction } from "@/lib/types";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { deviceId, dateKey, matchId, step, resultPick, ouPick } = body;

        if (!deviceId || !dateKey || !matchId || !step) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Initialize user if needed
        let userState = await getUserState(deviceId);
        if (!userState) {
            userState = await initializeUser(deviceId);
        }

        // Get or create prediction entry for this date
        if (!userState.predictions[dateKey]) {
            userState.predictions[dateKey] = {};
        }

        const datePredictions = userState.predictions[dateKey] as any;

        if (!datePredictions[matchId]) {
            datePredictions[matchId] = { matchId };
        }

        const prediction = datePredictions[matchId] as UserPrediction;

        // Update based on step
        if (step === 1) {
            if (resultPick && ["1", "X", "2"].includes(resultPick)) {
                // Check if already predicted (optional: prevent double counting?)
                // For simplicity and atomic speed, we assume the frontend prevents duplicates (which we did earlier).
                // If a user changes their mind, we don't decrement the old one here (limitations of simple INCR).
                // Given the flow, user can't change mind easily once submitted.
                if (prediction.resultPick !== resultPick) {
                    prediction.resultPick = resultPick as ResultPick;
                    await incrementMatchStats(matchId, resultPick);
                }
            }
        } else if (step === 2) {
            if (ouPick && ["over", "under"].includes(ouPick)) {
                if (prediction.ouPick !== ouPick) {
                    prediction.ouPick = ouPick as OUPick;
                    prediction.completedAt = Date.now(); // Mark as complete
                    await incrementMatchStats(matchId, ouPick);
                }
            }
        }

        // Save updated user state
        await upsertUserState(userState);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save prediction error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
