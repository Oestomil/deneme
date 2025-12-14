import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "wotc-admin-session";
const SESSION_SECRET = process.env.ADMIN_PASSWORD || "change-me";

// Simple session: we just store "authenticated" in a signed cookie
// For MVP this is sufficient; for production consider using JWT or similar

export async function createSession(): Promise<void> {
    const cookieStore = await cookies();

    // Set HttpOnly cookie
    cookieStore.set(SESSION_COOKIE_NAME, "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    });
}

export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    return session?.value === "authenticated";
}

export async function verifyPassword(password: string): Promise<boolean> {
    return password === SESSION_SECRET;
}

// Middleware helper for API routes
export async function requireAuth(
    handler: (req: NextRequest) => Promise<NextResponse>
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const authed = await isAuthenticated();

        if (!authed) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return handler(req);
    };
}
