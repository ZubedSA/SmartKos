const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\e7732eb7-0ac9-4455-8ed0-47ebdf07d061\\.user_uploaded\\media_1790948963776.png";
const dest = path.join(__dirname, "public", "qris.png");

try {
    fs.copyFileSync(src, dest);
    console.log("Successfully copied QRIS image to public/qris.png");
} catch (err) {
    console.error("Copy error:", err);
}
