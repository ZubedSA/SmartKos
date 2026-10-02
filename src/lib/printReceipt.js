/**
 * Print utility for SmartKos Kwitansi
 * Copies the receipt element into an isolated hidden iframe and triggers native print.
 */
export const printReceiptElement = (elementId = "printable-receipt") => {
    const receiptEl = document.getElementById(elementId);
    if (!receiptEl) {
        window.print();
        return;
    }

    // Remove old print iframe if any exists
    const existingIframe = document.getElementById("smartkos-print-iframe");
    if (existingIframe) {
        existingIframe.remove();
    }

    // Create temporary hidden iframe
    const iframe = document.createElement("iframe");
    iframe.id = "smartkos-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html lang="id">
            <head>
                <title>Bukti Pembayaran Kwitansi - SmartKos</title>
                <meta charset="utf-8" />
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    * {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        padding: 16px;
                        margin: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }
                    #${elementId} {
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        margin: 0 auto !important;
                        max-width: 680px !important;
                    }
                </style>
            </head>
            <body>
                <div>
                    ${receiptEl.outerHTML}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.focus();
                            window.print();
                        }, 400);
                    };
                </script>
            </body>
        </html>
    `);
    doc.close();

    // Cleanup iframe after printing
    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 3000);
};
