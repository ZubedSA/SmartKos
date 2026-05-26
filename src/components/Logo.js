export default function Logo({ className = "w-10 h-10" }) {
    return (
        <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Chimney (grey, on the right) */}
            <path d="M356 80h60v120h-60z" fill="#64748b" />
            
            {/* Main House Wall (light cream-white) */}
            <path d="M80 200h352v260H80z" fill="#f8fafc" />
            
            {/* Roof (red, triangle) */}
            <path d="M40 220L256 30l216 190H40z" fill="#ef4444" />
            
            {/* Attic Window Circle (red frame, dark inside) */}
            <circle cx="256" cy="140" r="32" fill="#ef4444" />
            <circle cx="256" cy="140" r="22" fill="#1e293b" />
            
            {/* Door (brown, on the left) */}
            <path d="M120 280h110v180H120z" fill="#7c2d12" />
            {/* Door Knob (yellow gold) */}
            <circle cx="210" cy="370" r="6" fill="#f59e0b" />
            
            {/* Window (brown outer border, on the right) */}
            <path d="M270 280h120v130H270z" fill="#7c2d12" />
            {/* Window Glass Pane (light blue) */}
            <path d="M282 292h96v106H282z" fill="#38bdf8" />
            {/* Window cross separator */}
            <path d="M282 345h96M330 292v106" stroke="#7c2d12" strokeWidth="8" />
            
            {/* Green Bushes at the bottom left & right */}
            <path d="M10 440h95v40H10z" fill="#22c55e" rx="12" />
            <path d="M405 440h97v40H405z" fill="#22c55e" rx="12" />
            <path d="M205 450h102v30H205z" fill="#22c55e" rx="8" />
        </svg>
    );
}
