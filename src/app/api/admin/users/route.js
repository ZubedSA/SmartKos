import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

// GET: List all users (with optional role / search filter)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const supabaseAdmin = getAdminClient();

        let query = supabaseAdmin
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });

        if (role && role !== "all") {
            query = query.eq("role", role);
        }

        if (status && status !== "all") {
            if (status === "pending") {
                query = query.eq("is_approved", false);
            } else {
                query = query.eq("subscription_status", status);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching users:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        let filtered = data || [];
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
                (u) =>
                    u.name?.toLowerCase().includes(q) ||
                    u.email?.toLowerCase().includes(q)
            );
        }

        return NextResponse.json({ users: filtered });
    } catch (err) {
        console.error("Unexpected error in GET /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create a new user (in auth.users AND public.users)
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, password, role = "owner", subscription_status = "active", subscription_days = 30 } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Nama, email, dan password wajib diisi" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password minimal 6 karakter" },
                { status: 400 }
            );
        }

        const supabaseAdmin = getAdminClient();

        // 1. Create auth user with email confirmed
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role },
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user.id;

        // Calculate subscription expiry
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (parseInt(subscription_days) || 30));
        const formattedExpiry = expiryDate.toISOString().split("T")[0];

        // 2. Insert / Upsert into public.users
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("users")
            .upsert({
                id: userId,
                name,
                email,
                role,
                subscription_status,
                subscription_expired_at: role === "admin" ? null : formattedExpiry,
                is_approved: true,
            })
            .select()
            .single();

        if (profileError) {
            // Clean up auth user if profile insert fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({
            message: "User berhasil dibuat",
            user: profile,
        });
    } catch (err) {
        console.error("Unexpected error in POST /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update user profile and subscription
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, email, role, subscription_status, subscription_expired_at, is_approved, newPassword } = body;

        if (!id) {
            return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
        }

        const supabaseAdmin = getAdminClient();

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (subscription_status !== undefined) updateData.subscription_status = subscription_status;
        if (subscription_expired_at !== undefined) updateData.subscription_expired_at = subscription_expired_at;
        if (is_approved !== undefined) updateData.is_approved = is_approved;

        // 1. Update public.users
        const { data: updatedProfile, error: dbError } = await supabaseAdmin
            .from("users")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        // 2. Update auth.users if email or password changed
        const authUpdates = {};
        if (email) authUpdates.email = email;
        if (newPassword && newPassword.length >= 6) authUpdates.password = newPassword;
        if (name || role) {
            authUpdates.user_metadata = {
                ...(name && { name }),
                ...(role && { role }),
            };
        }

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
            if (authError) {
                console.warn("Auth update warning:", authError.message);
            }
        }

        return NextResponse.json({
            message: "Data user berhasil diperbarui",
            user: updatedProfile,
        });
    } catch (err) {
        console.error("Unexpected error in PUT /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Delete user from both auth.users and public.users
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
        }

        const supabaseAdmin = getAdminClient();

        // 1. Delete from public.users (cascade should delete kos, kamar, penyewa, etc.)
        const { error: dbError } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", userId);

        if (dbError) {
            console.error("Error deleting from public.users:", dbError);
        }

        // 2. Delete from auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.error("Error deleting auth user:", authError);
            // If user not found in auth, but deleted in DB, it's still clean
            if (!authError.message.includes("User not found")) {
                return NextResponse.json({ error: authError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ message: "User berhasil dihapus secara permanen" });
    } catch (err) {
        console.error("Unexpected error in DELETE /api/admin/users:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
