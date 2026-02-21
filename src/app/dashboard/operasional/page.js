import { useKos } from "@/context/KosContext";

export default function OperasionalPage() {
    const { selectedKosId, kosList } = useKos();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [formData, setFormData] = useState({
        keterangan: "",
        jumlah: "",
        tanggal: new Date().toISOString().split("T")[0],
        kategori: "Lainnya",
        kos_id: ""
    });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    const supabase = createClient();

    useEffect(() => {
        fetchOperasional();
    }, [selectedKosId]);

    const fetchOperasional = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("operasional")
                .select("*")
                .order("tanggal", { ascending: false });

            if (selectedKosId !== "all") {
                query = query.eq("kos_id", selectedKosId);
            }

            const { data: expenses, error } = await query;

            if (error) throw error;
            setData(expenses || []);
        } catch (error) {
            console.error("Error fetching operational data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setFormData({
            keterangan: "",
            jumlah: "",
            tanggal: new Date().toISOString().split("T")[0],
            kategori: "Lainnya",
            kos_id: selectedKosId !== "all" ? selectedKosId : (kosList[0]?.id || "")
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from("operasional")
                .insert([{ ...formData, jumlah: parseInt(formData.jumlah), user_id: user.id }]);

            if (error) throw error;
            setIsModalOpen(false);
            fetchOperasional();
        } catch (error) {
            alert("Gagal menyimpan data: " + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        setSubmitLoading(true);
        try {
            const { error } = await supabase.from("operasional").delete().eq("id", confirmModal.id);
            if (error) throw error;
            setConfirmModal({ isOpen: false, id: null });
            fetchOperasional();
        } catch (error) {
            alert("Gagal menghapus data: " + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const totalBulanIni = data
        .filter(item => {
            const d = new Date(item.tanggal);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((acc, curr) => acc + curr.jumlah, 0);

    const columns = [
        {
            key: "keterangan",
            label: "Keterangan",
            render: (val, row) => (
                <div>
                    <p className="font-medium text-white">{val}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{row.kategori}</p>
                </div>
            )
        },
        {
            key: "tanggal",
            label: "Tanggal",
            render: (val) => new Date(val).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })
        },
        {
            key: "jumlah",
            label: "Nominal",
            render: (val) => <span className="text-red-400 font-bold">Rp {formatRupiah(val)}</span>
        }
    ];

    return (
        <div className="pb-24 lg:pb-0">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Biaya Operasional</h1>
                    <p className="text-slate-400 text-sm">Kelola pengeluaran rutin untuk pemeliharaan kos.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Catat Biaya
                </button>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between backdrop-blur-sm">
                <div>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Pengeluaran Bulan Ini</p>
                    <h2 className="text-3xl font-black text-white">
                        Rp {formatRupiah(totalBulanIni)}
                    </h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center rotate-180">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <svg className="animate-spin w-8 h-8 text-red-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={data}
                    emptyMessage="Belum ada catatan pengeluaran operasional."
                    actions={(row) => (
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                />
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Catat Operasional"
                size="sm"
                footer={(
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-400 font-medium">Batal</button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitLoading}
                            className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50"
                        >
                            Simpan Data
                        </button>
                    </>
                )}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Pilih Kos</label>
                        <select
                            required
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            value={formData.kos_id}
                            onChange={(e) => setFormData({ ...formData, kos_id: e.target.value })}
                        >
                            <option value="">Pilih Kos</option>
                            {kosList.map(k => <option key={k.id} value={k.id}>{k.nama_kos}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Keterangan</label>
                        <input
                            required
                            type="text"
                            placeholder="Contoh: Pembayaran Listrik"
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            value={formData.keterangan}
                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Kategori</label>
                        <select
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            value={formData.kategori}
                            onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                        >
                            {KATEGORI_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Nominal (Rp)</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                value={formData.jumlah}
                                onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Tanggal</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                value={formData.tanggal}
                                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                loading={submitLoading}
                type="danger"
                title="Hapus Catatan"
                message="Data ini akan dihapus permanen dari riwayat pengeluaran Anda."
            />
        </div>
    );
}
