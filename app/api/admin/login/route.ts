import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json(
                { error: "Password required" },
                { status: 400 }
            );
        }

        const valid = await verifyPassword(password);

        if (!valid) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }

        await createSession();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
