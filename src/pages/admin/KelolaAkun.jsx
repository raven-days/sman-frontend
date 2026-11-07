import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { api } from "../../lib/api";
import { ROLES } from "../../data/content";
import { useToast } from "../../context/Toast";
import { useConfirm } from "../../context/Confirm";
import { useSubmit } from "../../lib/useSubmit";
import { galatPerKolom, fokusSalah } from "../../lib/validasi";
import Field, { inputCls } from "../../components/Field";
import Modal from "../../components/Modal";
import ImporAkun from "./ImporAkun";
import { DaftarBarisSkeleton } from "../../components/Skeleton";

const MODUL = [
  ["pengajuan", "Antrian pengajuan"],
  ["sk", "Surat Keputusan"],
  ["pegawai", "Data pegawai"],
  ["pengumuman", "Pengumuman"],
  ["banner", "Banner beranda"],
  ["kontak", "Kontak & FAQ"]
];
const SEMUA_MODUL = MODUL.map(([k]) => k);
const labelRole = (id) => ROLES.find((r) => r.id === id)?.label ?? id;
const kosong = () => ({ id: null, name: "", username: "", role: "siswa", is_admin: false, izin: ["pengajuan"], saya: false });

const aksiCls = "rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-surface";

export default function KelolaAkun() {
  const toast = useToast();
  const confirm = useConfirm();
  const formRef = useRef(null);
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [cariInput, setCariInput] = useState("");
  const [cari, setCari] = useState("");
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});
  const [sandi, setSandi] = useState(null); // { judul, username, sandi }
  const [impor, setImpor] = useState(false);
  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page });
      if (role) qs.set("role", role);
      if (cari) qs.set("cari", cari);
      setHasil(await api(`/admin/akun?${qs}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, role, cari]);

  useEffect(() => { muat(); }, [muat]);

  const baris = hasil?.data ?? [];
  const terakhir = hasil?.last_page ?? 1;

  const bukaForm = (data) => { setErrs({}); setForm(data); };
  const tutupForm = () => { if (saving) return; setForm(null); setErrs({}); };

  const ubah = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleIzin = (k) =>
    setForm((f) => ({ ...f, izin: f.izin.includes(k) ? f.izin.filter((x) => x !== k) : [...f.izin, k] }));

  const [simpan, saving] = useSubmit(async (e) => {
    e.preventDefault();
    const salah = {};
    if (!form.name.trim()) salah.name = "Nama wajib diisi.";
    if (!form.id) {
      if (!form.username.trim()) salah.username = "Username wajib diisi.";
      else if (!/^[A-Za-z0-9._-]+$/.test(form.username.trim()))
        salah.username = "Hanya huruf, angka, titik, garis bawah, dan strip.";
    }
    setErrs(salah);
    if (Object.keys(salah).length) return fokusSalah(formRef.current);

    const tu = form.role === "tu";
    const body = {
      name: form.name.trim(),
      is_admin: tu && form.is_admin,
      izin: tu ? (form.is_admin ? SEMUA_MODUL : form.izin) : [],
    };

    try {
      if (form.id) {
        await api(`/admin/akun/${form.id}`, { method: "PUT", body });
        toast.success(`Akun ${form.username} diperbarui.`);
      } else {
        const res = await api("/admin/akun", {
          method: "POST",
          body: { ...body, username: form.username.trim(), role: form.role },
        });
        setSandi({ judul: "Akun berhasil dibuat", username: res.akun.username, sandi: res.sandi_sementara });
      }
      setForm(null);
      setErrs({});
      await muat();
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setErrs(galatPerKolom(err.errors));
        fokusSalah(formRef.current);
        toast.error("Periksa kembali isian yang ditandai.");
      } else {
        toast.galat(err);
      }
    }
  });

  const ubahAktif = async (a) => {
    const nonaktifkan = a.is_active;
    const ya = await confirm({
      title: nonaktifkan ? "Nonaktifkan akun ini?" : "Aktifkan akun ini?",
      description: nonaktifkan
        ? "Pemilik akun tidak bisa masuk dan langsung dikeluarkan dari semua perangkat."
        : "Pemilik akun bisa masuk kembali.",
      items: [
        { label: "Nama", value: a.name },
        { label: "Username", value: a.username },
      ],
      confirmText: nonaktifkan ? "Nonaktifkan" : "Aktifkan",
      tone: nonaktifkan ? "warning" : "primary",
      action: () => api(`/admin/akun/${a.id}/aktif`, { method: "POST", body: { aktif: !nonaktifkan } }),
    });
    if (ya) {
      toast.success(`Akun ${a.username} ${nonaktifkan ? "dinonaktifkan" : "diaktifkan"}.`);
      muat();
    }
  };

  const bukaKunci = async (a) => {
    const ya = await confirm({
      title: "Buka kunci login?",
      description: "Akun ini bisa langsung mencoba masuk lagi tanpa menunggu waktu kunci habis.",
      items: [
        { label: "Nama", value: a.name },
        { label: "Username", value: a.username },
      ],
      confirmText: "Buka kunci",
      action: () => api(`/admin/akun/${a.id}/buka-kunci`, { method: "POST" }),
    });
    if (ya) {
      toast.success(`Kunci akun ${a.username} dibuka.`);
      muat();
    }
  };

  const resetSandi = async (a) => {
    let res = null;
    const ya = await confirm({
      title: "Reset kata sandi?",
      description: "Sandi lama tidak berlaku lagi, dan pemilik akun dikeluarkan dari semua perangkat. Sandi sementara baru akan tampil satu kali.",
      items: [
        { label: "Nama", value: a.name },
        { label: "Username", value: a.username },
      ],
      confirmText: "Reset sandi",
      tone: "warning",
      action: async () => { res = await api(`/admin/akun/${a.id}/reset-sandi`, { method: "POST" }); },
    });
    if (ya && res) {
      setSandi({ judul: "Sandi berhasil direset", username: a.username, sandi: res.sandi_sementara });
      muat();
    }
  };

  const salin = async (teks) => {
    try {
      await navigator.clipboard.writeText(teks);
      toast.success("Sandi disalin.");
    } catch {
      toast.warning("Tidak bisa menyalin otomatis. Salin secara manual.");
    }
  };

  const tu = form?.role === "tu";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Kelola Akun</h1>
          <p className="mt-1 text-sm text-slate-600">Buat akun, atur hak akses, dan kelola status akun pengguna.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImpor(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface active:scale-[0.98]"
          >
            <ArrowUpTrayIcon className="h-5 w-5" /> Impor Akun
          </button>
          <button
            type="button"
            onClick={() => bukaForm(kosong())}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]"
          >
            <PlusIcon className="h-5 w-5" /> Tambah Akun
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); setCari(cariInput.trim()); }}
        className="mt-5 flex flex-wrap gap-3"
      >
        <input
          value={cariInput}
          onChange={(e) => setCariInput(e.target.value)}
          placeholder="Cari nama atau username"
          aria-label="Cari akun"
          className="h-11 min-w-[220px] flex-1 rounded-lg border border-line px-3 text-sm"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          aria-label="Filter peran"
          className="h-11 rounded-lg border border-line px-3 text-sm"
        >
          <option value="">Semua peran</option>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <button className="h-11 rounded-lg border border-line bg-white px-5 text-sm font-semibold text-navy hover:bg-surface">Cari</button>
      </form>

      {error && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={muat} className="font-semibold underline">Coba lagi</button>
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Peran</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Login terakhir</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={6} className="px-4 py-6"><DaftarBarisSkeleton n={4} /></td></tr>}
            {!loading && !error && baris.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Tidak ada akun.</td></tr>
            )}
            {baris.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy">{a.name}</p>
                  {a.saya && <span className="text-xs text-primary">(akun Anda)</span>}
                </td>
                <td className="px-4 py-3">{a.username}</td>
                <td className="px-4 py-3">
                  {labelRole(a.role)}
                  {a.is_admin && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${a.is_active ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                      {a.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                    {a.terkunci && <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800">Terkunci</span>}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{a.login_terakhir ?? "Belum pernah"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" className={aksiCls} onClick={() => bukaForm({ id: a.id, name: a.name, username: a.username, role: a.role, is_admin: a.is_admin, izin: a.izin, saya: a.saya })}>Ubah</button>
                    {a.terkunci && <button type="button" className={aksiCls} onClick={() => bukaKunci(a)}>Buka kunci</button>}
                    {!a.saya && <button type="button" className={aksiCls} onClick={() => resetSandi(a)}>Reset sandi</button>}
                    {!a.saya && (
                      <button type="button" className={aksiCls} onClick={() => ubahAktif(a)}>
                        {a.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-50">
          Sebelumnya
        </button>
        <span className="text-slate-600">Halaman {page} dari {terakhir}</span>
        <button type="button" disabled={page >= terakhir || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-50">
          Berikutnya
        </button>
      </div>

      {form && (
        <Modal title={form.id ? "Ubah Akun" : "Tambah Akun"} onClose={tutupForm} locked={saving}>
          <form ref={formRef} onSubmit={simpan} noValidate className="space-y-4">
            <Field label="Nama lengkap" required error={errs.name}>
              {(p) => <input {...p} value={form.name} onChange={ubah("name")} className={`${inputCls(errs.name)} h-11`} />}
            </Field>
            <Field
              label="Username (untuk login)"
              required
              error={errs.username}
              hint={form.id ? "Username tidak bisa diubah." : "Siswa: NIS. Guru: NIP atau username."}
            >
              {(p) => <input {...p} value={form.username} onChange={ubah("username")} disabled={!!form.id} className={`${inputCls(errs.username)} h-11 disabled:bg-surface`} />}
            </Field>
            <Field label="Peran" error={errs.role} hint={form.id ? "Peran tidak bisa diubah setelah akun dibuat." : undefined}>
              {(p) => (
                <select {...p} value={form.role} onChange={ubah("role")} disabled={!!form.id} className={`${inputCls(errs.role)} h-11 disabled:bg-surface`}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              )}
            </Field>

            {tu && (
              <fieldset className="rounded-lg border border-line p-3">
                <legend className="px-1 text-sm font-semibold text-navy">Hak akses petugas</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_admin}
                    disabled={form.saya}
                    onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))}
                  />
                  Admin (kelola akun, log audit, dan semua modul)
                </label>
                {form.saya && <p className="mt-1 text-xs text-slate-500">Anda tidak dapat mencabut status admin dari akun sendiri.</p>}
                <div className="mt-3 grid gap-1.5 border-t border-line pt-3">
                  {MODUL.map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        disabled={form.is_admin}
                        checked={form.is_admin || form.izin.includes(k)}
                        onChange={() => toggleIzin(k)}
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {!form.id && (
              <p className="rounded-lg bg-surface px-3 py-2 text-xs text-slate-600">
                Sandi sementara dibuat otomatis dan ditampilkan sekali setelah akun disimpan.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={tutupForm} disabled={saving} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:opacity-60">Batal</button>
              <button disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {sandi && (
        <Modal
          title={sandi.judul}
          onClose={() => setSandi(null)}
          footer={
            <button type="button" onClick={() => setSandi(null)} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
              Saya sudah mencatat
            </button>
          }
        >
          <p className="text-sm text-slate-700">Berikan data berikut kepada pemilik akun:</p>
          <dl className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface text-sm">
            <div className="grid gap-1 px-3 py-2 sm:grid-cols-3">
              <dt className="text-slate-500">Username</dt>
              <dd className="font-semibold text-navy sm:col-span-2">{sandi.username}</dd>
            </div>
            <div className="grid items-center gap-1 px-3 py-2 sm:grid-cols-3">
              <dt className="text-slate-500">Sandi sementara</dt>
              <dd className="flex items-center gap-2 sm:col-span-2">
                <code className="select-all rounded bg-white px-2 py-1 font-semibold text-navy">{sandi.sandi}</code>
                <button type="button" onClick={() => salin(sandi.sandi)} className={aksiCls}>Salin</button>
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-900">
                       Sandi ini hanya tampil sekali dan tidak disimpan di tempat lain. Saat pertama kali masuk, pemilik akun akan diminta membuat sandi baru.
                       </p>
        </Modal>
      )}
      {impor && <ImporAkun onClose={() => setImpor(false)} onSelesai={muat} />}
    </>
  );
}