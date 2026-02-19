import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return request.cookies.get(name)?.value;
                },
                set(name, value, options) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name, options) {
                    request.cookies.set({ name, value: "", ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: "", ...options });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    // Public routes (accessible without login or with login but pending)
    const publicRoutes = ["/login", "/register", "/pending-approval"];
    if (publicRoutes.includes(pathname)) {
        if (user) {
            // Already logged in, check approval status for owners
            const { data: profile } = await supabase
                .from("users")
                .select("role, is_approved")
                .eq("id", user.id)
                .single();

            if (!profile) return response;

            // If user is at /pending-approval and still not approved, let them stay
            if (pathname === "/pending-approval" && profile.role === "owner" && !profile.is_approved) {
                return response;
            }

            // Redirect approved users/admins away from public routes
            if (profile.role === "admin") {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
            if (profile.is_approved) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }
        }
        return response;
    }

    // Protected routes - must be logged in
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get user profile
    const { data: profile } = await supabase
        .from("users")
        .select("role, subscription_status, subscription_expired_at, is_approved")
        .eq("id", user.id)
        .single();

    // If profile not found, allow access (don't redirect to prevent loop)
    // The page itself will handle the missing profile case
    if (!profile) {
        return response;
    }

    // Approval check for owners
    if (profile.role === "owner" && !profile.is_approved && pathname !== "/pending-approval") {
        return NextResponse.redirect(new URL("/pending-approval", request.url));
    }

    // Admin routes protection
    if (pathname.startsWith("/admin") && profile.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Owner subscription check (skip for admin, billing page, and pending-approval)
    if (profile.role === "owner" && pathname !== "/billing" && pathname !== "/pending-approval") {
        const isExpired =
            profile.subscription_status === "inactive" ||
            (profile.subscription_expired_at &&
                new Date(profile.subscription_expired_at) < new Date());

        if (isExpired) {
            return NextResponse.redirect(new URL("/billing", request.url));
        }
    }

    // Prevent admin from accessing owner routes
    if (pathname.startsWith("/dashboard") && profile.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin/:path*",
        "/billing",
        "/login",
        "/register",
        "/pending-approval",
    ],
};
