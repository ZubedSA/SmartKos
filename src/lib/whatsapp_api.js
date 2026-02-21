/**
 * Kirim pesan WhatsApp menggunakan API Fonnte
 * @param {string} target - Nomor telepon tujuan
 * @param {string} message - Isi pesan
 * @param {string} token - API Token Fonnte
 */
export async function sendWhatsAppAPI(target, message, token) {
    if (!token) {
        console.error("WhatsApp API Token tidak ditemukan");
        return { status: false, msg: "Token missing" };
    }

    // Normalisasi nomor telepon
    let phone = target.replace(/[\s\-\+]/g, "");
    if (phone.startsWith("08")) {
        phone = "62" + phone.substring(1);
    }

    try {
        const response = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                target: phone,
                message: message,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error sending WhatsApp via Fonnte:", error);
        return { status: false, msg: error.message };
    }
}
