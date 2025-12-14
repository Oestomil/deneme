import { NextRequest, NextResponse } from "next/server";
import { getUserState, initializeUser } from "@/lib/kv";
import type { UserStateResponse, UserPrediction } from "@/lib/types";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get("deviceId");
        const dateKey = searchParams.get("dateKey");

        if (!deviceId || !dateKey) {
            return NextResponse.json(
                { error: "deviceId and dateKey required" },
                { status: 400 }
            );
        }

        // Initialize user if needed
        let userState = await getUserState(deviceId);
        if (!userState) {
            userState = await initializeUser(deviceId);
        }

        // Count answered (completed) predictions for this date
        const datePredictions = userState.predictions[dateKey] || {};
        const predictions = Object.values(datePredictions) as UserPrediction[];
        const answeredCount = predictions.filter((p) => p.completedAt).length;

        const response: UserStateResponse = {
            tokens: userState.tokens,
            answeredCount,
            unlockedMatchIds: userState.unlockedMatchIds,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Get user state error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
