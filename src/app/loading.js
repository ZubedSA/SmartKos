export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                    {/* Multi-layered spinning rings for premium feel */}
                    <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin [animation-duration:1.5s]"></div>
                    <div className="absolute inset-3 border-4 border-b-purple-500 rounded-full animate-spin [animation-direction:reverse] [animation-duration:2s]"></div>

                    {/* Center glow */}
                    <div className="absolute inset-8 bg-indigo-500 rounded-full blur-xl animate-pulse"></div>
                </div>

                <div className="flex flex-col items-center space-y-2">
                    <h1 className="text-3xl font-black gradient-text tracking-tighter animate-pulse">
                        SmartKos
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap border-r-2 border-indigo-500 animate-typing">
                        Mohon Tunggu...
                    </p>
                </div>
            </div>
        </div>
    );
}
