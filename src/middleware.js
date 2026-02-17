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

    // Public routes
    const publicRoutes = ["/login", "/register"];
    if (publicRoutes.includes(pathname)) {
        if (user) {
            // Already logged in, try to redirect to dashboard
            const { data: profile } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();

            // If profile not found, stay on login (don't redirect to prevent loop)
            if (!profile) {
                return response;
            }

            if (profile.role === "admin") {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
            return NextResponse.redirect(new URL("/dashboard", request.url));
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
        .select("role, subscription_status, subscription_expired_at")
        .eq("id", user.id)
        .single();

    // If profile not found, allow access (don't redirect to prevent loop)
    // The page itself will handle the missing profile case
    if (!profile) {
        return response;
    }

    // Admin routes protection
    if (pathname.startsWith("/admin") && profile.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Owner subscription check (skip for admin and billing page)
    if (profile.role === "owner" && pathname !== "/billing") {
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
    ],
};
