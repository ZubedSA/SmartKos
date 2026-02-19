"use client";

import Modal from "./Modal";

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Konfirmasi",
    message,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    type = "danger", // 'danger', 'warning', 'info', 'success'
    loading = false
}) {
    const typeStyles = {
        danger: {
            icon: (
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            ),
            button: "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
        },
        warning: {
            icon: (
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            ),
            button: "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
        },
        info: {
            icon: (
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            ),
            button: "bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
        },
        success: {
            icon: (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            ),
            button: "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
        }
    };

    const footer = (
        <>
            <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-slate-400 font-medium hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
            >
                {cancelText}
            </button>
            <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50 ${typeStyles[type].button}`}
            >
                {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {confirmText}
            </button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
            <div className="flex flex-col items-center text-center">
                {typeStyles[type].icon}
                <p className="text-slate-300 leading-relaxed">
                    {message}
                </p>
            </div>
        </Modal>
    );
}
