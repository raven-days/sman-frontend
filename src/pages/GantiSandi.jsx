import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useApp } from "../context/AppState";
import { useToast } from "../context/Toast";
import { useSubmit } from "../lib/useSubmit";

const inputCls =
  "h-12 w-full rounded-lg border border-line px-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function GantiSandi() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, dispatch } = useApp();
  const wajib = !!user?.wajib_ganti_sandi;
  const [form, setForm] = useState({ sandi_lama: "", sandi_baru: "", sandi_baru_confirmation: "" });
  const [error, setError] = useState("");

  const ubah = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    setError("");
    if (!form.sandi_lama) return setError(wajib ? "Isi sandi sementara dari Tata Usaha." : "Isi kata sandi lama.");
    if (form.sandi_baru.length < 8) return setError("Kata sandi baru minimal 8 karakter.");
    if (!/[A-Za-z]/.test(form.sandi_baru) || !/\d/.test(form.sandi_baru))
      return setError("Kata sandi baru harus mengandung huruf dan angka.");
    if (form.sandi_baru !== form.sandi_baru_confirmation) return setError("Konfirmasi kata sandi tidak sama.");
    try {
      await api("/ganti-sandi", { method: "POST", body: form });
      dispatch({ type: "LOGIN", user: { ...user, wajib_ganti_sandi: false } });
      toast.success("Kata sandi berhasil diganti.");
      navigate("/akun");
    } catch (err) {
      setError(err.errors ? Object.values(err.errors)[0][0] : err.message);
    }
  });

  return (
    <div className="mx-auto max-w-[520px] px-5 py-12 sm:px-8">
      {!wajib && (
        <nav className="text-xs text-slate-500">
          <Link to="/akun" className="hover:text-primary">Akun Saya</Link> / Ganti Kata Sandi
        </nav>
      )}
      <h1 className="mt-3 text-3xl font-extrabold text-navy">Ganti Kata Sandi</h1>
      {wajib ? (
        <p role="status" className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          Anda masuk dengan sandi sementara. Buat kata sandi baru sebelum melanjutkan.
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-600">
          Minimal 8 karakter, mengandung huruf dan angka. Perangkat lain akan otomatis keluar.
        </p>
      )}
      <form onSubmit={simpan} className="mt-7 space-y-5" noValidate>
        <div>
          <label htmlFor="sandi_lama" className="mb-1.5 block text-sm font-semibold text-navy">
            {wajib ? "Sandi sementara" : "Kata sandi lama"}
          </label>
          <input id="sandi_lama" type="password" autoComplete="current-password" value={form.sandi_lama} onChange={ubah("sandi_lama")} className={inputCls} />
        </div>
        <div>
          <label htmlFor="sandi_baru" className="mb-1.5 block text-sm font-semibold text-navy">Kata sandi baru</label>
          <input id="sandi_baru" type="password" autoComplete="new-password" value={form.sandi_baru} onChange={ubah("sandi_baru")} className={inputCls} />
        </div>
        <div>
          <label htmlFor="sandi_baru_confirmation" className="mb-1.5 block text-sm font-semibold text-navy">Ulangi kata sandi baru</label>
          <input id="sandi_baru_confirmation" type="password" autoComplete="new-password" value={form.sandi_baru_confirmation} onChange={ubah("sandi_baru_confirmation")} className={inputCls} />
        </div>
        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}
        <button type="submit" disabled={saving} className="h-12 w-full rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-70">
          {saving ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
        </button>
      </form>
    </div>
  );
}