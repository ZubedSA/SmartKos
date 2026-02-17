export default function StatsCard({ icon, label, value, color = "indigo", trend }) {
    const colorMap = {
        indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" },
        green: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
        yellow: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
        red: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
        purple: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
        blue: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
    };

    const c = colorMap[color] || colorMap.indigo;

    return (
        <div className={`${c.bg} border ${c.border} rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.text}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}>
                        {trend > 0 ? "+" : ""}{trend}%
                    </span>
                )}
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            <p className="text-sm text-slate-400">{label}</p>
        </div>
    );
}
