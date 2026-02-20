export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="relative w-16 h-16">
                {/* Outer ring */}
                <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
                {/* Spinning ring */}
                <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                {/* Inner pulse */}
                <div className="absolute inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full animate-pulse"></div>
            </div>

            <div className="flex flex-col items-center space-y-1">
                <h2 className="text-xl font-black gradient-text tracking-tight animate-pulse">
                    SmartKos
                </h2>
                <div className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
            </div>
        </div>
    );
}
