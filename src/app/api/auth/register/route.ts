import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createUser } from "@/lib/server/user-service";
import { loadSystemSettings } from "@/lib/server/env-file";

const REGISTER_WINDOW_MS = 60 * 1000;
const REGISTER_MAX_REQUESTS = 20;
const REGISTER_MAX_REQUESTS_TOTAL = 100;

export async function POST(request: NextRequest) {
  try {
    // Check if public sign-up is enabled
    const { signupEnabled } = loadSystemSettings();
    if (!signupEnabled) {
      return NextResponse.json(
        {
          error:
            "Public sign-up is currently disabled. Please contact an administrator.",
        },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, username, password } = body ?? {};
    // Without a trusted client IP every caller shares one bucket, so a whole
    // team signing up at once would be refused. Limit per requested username,
    // under a higher ceiling across all sign-ups.
    const total = checkRateLimit(request, {
      keyPrefix: "register-total",
      windowMs: REGISTER_WINDOW_MS,
      maxRequests: REGISTER_MAX_REQUESTS_TOTAL,
    });
    const perUsername = checkRateLimit(request, {
      keyPrefix: "register",
      windowMs: REGISTER_WINDOW_MS,
      maxRequests: REGISTER_MAX_REQUESTS,
      subject:
        typeof username === "string" && username.trim()
          ? `user:${username.trim().toLowerCase().slice(0, 64)}`
          : undefined,
    });
    const rateLimit = total.limited ? total : perUsername;

    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: "Too many account creation attempts. Please try again later.",
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit, REGISTER_MAX_REQUESTS),
        },
      );
    }

    const result = await createUser(
      {
        name,
        username,
        password,
        role: "scout",
      },
      { preventDuplicateName: true },
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.status },
      );
    }

    return NextResponse.json(
      { message: "User created successfully", userId: result.userId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
