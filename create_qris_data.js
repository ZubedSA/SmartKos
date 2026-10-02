const fs = require('fs');
const path = require('path');

const imgPath = "C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\e7732eb7-0ac9-4455-8ed0-47ebdf07d061\\.user_uploaded\\media_1790948963776.png";

try {
    const base64 = fs.readFileSync(imgPath).toString('base64');
    const content = `export const QRIS_IMAGE_DATA = "data:image/png;base64,${base64}";\n`;
    fs.writeFileSync(path.join(__dirname, "src", "lib", "qrisData.js"), content);
    console.log("qrisData.js created successfully!");
} catch (err) {
    console.error("Error generating qrisData.js:", err);
}
