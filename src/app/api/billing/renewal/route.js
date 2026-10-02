import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import fs from "fs";
import path from "path";

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

function ensureQrisImage() {
    try {
        const dest = path.join(process.cwd(), "public", "qris.png");
        const qrisDataPath = path.join(process.cwd(), "src", "lib", "qrisData.js");
        const src = "C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\e7732eb7-0ac9-4455-8ed0-47ebdf07d061\\.user_uploaded\\media_1790948963776.png";
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            const base64 = fs.readFileSync(src).toString('base64');
            const content = `export const QRIS_IMAGE_DATA = "data:image/png;base64,${base64}";\n`;
            fs.writeFileSync(qrisDataPath, content);
        }
    } catch (err) {
        console.error("Error copying QRIS image:", err);
    }
}
ensureQrisImage();

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, planId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID tidak ditemukan" }, { status: 400 });
        }

        const supabaseAdmin = getAdminClient();

        // Update user status to unapproved and inactive for renewal approval
        const { data, error } = await supabaseAdmin
            .from("users")
            .update({
                is_approved: false,
                subscription_status: "inactive"
            })
            .eq("id", userId)
            .select()
            .single();

        if (error) {
            console.error("Error in billing renewal API:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: "Pengajuan perpanjangan berhasil dikirim",
            user: data,
        });
    } catch (err) {
        console.error("Unexpected error in /api/billing/renewal:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
