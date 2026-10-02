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

// GET: Fetch all pending approvals
export async function GET() {
    try {
        const supabaseAdmin = getAdminClient();
        const { data, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("is_approved", false)
            .eq("role", "owner")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ users: data || [] });
    } catch (err) {
        console.error("Unexpected error in GET /api/admin/approvals:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Approve or Reject a user
export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, action } = body; // action: 'approve' | 'reject'

        if (!userId || !action) {
            return NextResponse.json(
                { error: "User ID dan Action (approve/reject) wajib diisi" },
                { status: 400 }
            );
        }

        const supabaseAdmin = getAdminClient();

        if (action === "approve") {
            // Fetch target user first
            const { data: targetUser } = await supabaseAdmin
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();

            let baseDate = new Date();
            if (targetUser?.subscription_expired_at && new Date(targetUser.subscription_expired_at) > new Date()) {
                baseDate = new Date(targetUser.subscription_expired_at);
            }

            // Extend 30 days by default (or +365 if previously annual)
            const extensionDays = 30;
            const newExpiry = new Date(baseDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
            const formattedExpiry = newExpiry.toISOString().split("T")[0];

            const { data, error } = await supabaseAdmin
                .from("users")
                .update({
                    is_approved: true,
                    subscription_status: "active",
                    subscription_expired_at: targetUser?.subscription_expired_at ? formattedExpiry : (targetUser?.subscription_expired_at || formattedExpiry),
                })
                .eq("id", userId)
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                message: "Pengajuan berhasil disetujui & langganan diaktifkan",
                user: data,
            });
        } else if (action === "reject") {
            const { data: targetUser } = await supabaseAdmin
                .from("users")
                .select("subscription_status")
                .eq("id", userId)
                .single();

            if (targetUser?.subscription_status === "pending_renewal") {
                // For renewal rejection, reset to inactive status without deleting account
                await supabaseAdmin
                    .from("users")
                    .update({
                        subscription_status: "inactive",
                        is_approved: false
                    })
                    .eq("id", userId);

                return NextResponse.json({
                    message: "Pengajuan perpanjangan ditolak",
                });
            } else {
                // Delete new unapproved user registration
                await supabaseAdmin.from("users").delete().eq("id", userId);
                await supabaseAdmin.auth.admin.deleteUser(userId);

                return NextResponse.json({
                    message: "Pendaftaran user berhasil ditolak dan dihapus",
                });
            }
        } else {
            return NextResponse.json(
                { error: "Action tidak valid. Gunakan 'approve' atau 'reject'" },
                { status: 400 }
            );
        }
    } catch (err) {
        console.error("Unexpected error in POST /api/admin/approvals:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
