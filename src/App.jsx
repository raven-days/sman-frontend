import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RequireRole from "./components/RequireRole";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CekStatus from "./pages/CekStatus";
import LayananList from "./pages/LayananList";
import LayananDetail from "./pages/LayananDetail";
import AsetSekolah from "./pages/AsetSekolah";
import Kepegawaian from "./pages/Kepegawaian";
import AdministrasiPersuratan from "./pages/AdministrasiPersuratan";
import Kontak from "./pages/Kontak";
import Ajukan from "./pages/Ajukan";
import Akun from "./pages/Akun";
import PengajuanList from "./pages/PengajuanList";
import PengajuanDetail from "./pages/PengajuanDetail";
import PetugasList from "./pages/PetugasList";
import PetugasDetail from "./pages/PetugasDetail";
import ComingSoon from "./pages/ComingSoon";
import AdminLayout from "./pages/admin/AdminLayout";
import TuLayout from "./pages/admin/TuLayout";
import TuDashboard from "./pages/admin/Dashboard";
import AdminDashboard from "./pages/admin/DashboardAdmin";
import KelolaSK from "./pages/admin/KelolaSK";
import KelolaPegawai from "./pages/admin/KelolaPegawai";
import KelolaPengumuman from "./pages/admin/KelolaPengumuman";
import KelolaBanner from "./pages/admin/KelolaBanner";
import Pengumuman from "./pages/Pengumuman";
import PengumumanDetail from "./pages/PengumumanDetail";
import GantiSandi from "./pages/GantiSandi";
import KelolaAudit from "./pages/admin/KelolaAudit";
import KelolaAkun from "./pages/admin/KelolaAkun";
import KelolaKontak from "./pages/admin/KelolaKontak";
import LupaKataSandi from "./pages/LupaKataSandi";
import PermintaanReset from "./pages/admin/PermintaanReset";
import KelolaAset from "./pages/admin/KelolaAset";
import KelolaSiswa from "./pages/admin/KelolaSiswa";
import Anggaran from "./pages/Anggaran";
import KelolaAnggaran from "./pages/admin/KelolaAnggaran";
import KelolaDokumentasi from "./pages/admin/KelolaDokumentasi";
import FasilitasSekolah from "./pages/FasilitasSekolah";
import AjukanTamu from "./pages/AjukanTamu";
import KelolaLayanan from "./pages/admin/KelolaLayanan";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}


// Animasi halus saat pindah halaman. Dashboard (/admin, /tu) memakai satu kunci
// supaya menu samping tidak ikut dimuat ulang; isinya dianimasikan di PanelLayout.
function PageTransition({ children }) {
  const { pathname } = useLocation();
  const kunci = /^\/(admin|tu)(\/|$)/.test(pathname) ? "panel" : pathname;
  return <div key={kunci} className="anim-page-in">{children}</div>;
}

const SEMUA = ["siswa", "guru", "tu"];

export default function App() {
  return (
    <>
      <ScrollManager />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <PageTransition>
          <Routes>
            {/* Halaman publik */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/lupa-kata-sandi" element={<LupaKataSandi />} />
            <Route path="/cek-status" element={<CekStatus />} />
            <Route path="/layanan" element={<LayananList />} />
            <Route path="/layanan/kepegawaian" element={<Kepegawaian />} />
            <Route path="/layanan/aset" element={<AsetSekolah />} />
            <Route path="/layanan/kepegawaian" element={<Kepegawaian />} />
            <Route path="/layanan/anggaran" element={<Anggaran />} />
            <Route path="/layanan/administrasi-persuratan" element={<AdministrasiPersuratan />} />
            <Route path="/layanan/kebersihan-keamanan" element={<FasilitasSekolah />} />
            <Route path="/layanan/pengajuan/:slug" element={<AjukanTamu />} />
            <Route path="/layanan/:slug" element={<LayananDetail />} />
            <Route path="/layanan/:slug" element={<LayananDetail />} />
            <Route path="/layanan/:slug" element={<LayananDetail />} />
            <Route path="/pengumuman" element={<Pengumuman />} />
            <Route path="/pengumuman/:id" element={<PengumumanDetail />} />
            <Route path="/kontak" element={<Kontak />} />
            <Route path="/ajukan" element={<Ajukan />} />


            {/* Perlu masuk */}
            <Route path="/akun" element={<RequireRole roles={SEMUA}><Akun /></RequireRole>} />
            <Route path="/ganti-sandi" element={<RequireRole roles={SEMUA}><GantiSandi /></RequireRole>} />
            <Route path="/pengajuan" element={<RequireRole roles={["siswa", "guru"]}><PengajuanList /></RequireRole>} />
            <Route path="/pengajuan/:id" element={<RequireRole roles={SEMUA}><PengajuanDetail /></RequireRole>} />
            <Route path="/petugas" element={<RequireRole roles={["tu"]} izin="pengajuan"><PetugasList /></RequireRole>} />
            <Route path="/petugas/:id" element={<RequireRole roles={["tu"]} izin="pengajuan"><PetugasDetail /></RequireRole>} />
            <Route path="/dokumen" element={<Navigate to="/layanan/administrasi-persuratan" replace />} />
            <Route path="/surat-keputusan" element={<Navigate to="/layanan/administrasi-persuratan" replace />} />


            {/* Dashboard staf TU */}
            <Route path="/tu" element={<RequireRole roles={["tu"]}><TuLayout /></RequireRole>}>
              <Route index element={<TuDashboard />} />
              <Route path="layanan" element={<RequireRole izin="layanan"><KelolaLayanan /></RequireRole>} />
              <Route path="sk" element={<RequireRole izin="sk"><KelolaSK /></RequireRole>} />
              <Route path="pegawai" element={<RequireRole izin="pegawai"><KelolaPegawai /></RequireRole>} />
              <Route path="siswa" element={<RequireRole izin="siswa"><KelolaSiswa /></RequireRole>} />
              <Route path="anggaran" element={<RequireRole izin="anggaran"><KelolaAnggaran /></RequireRole>} />
              <Route path="layanan" element={<RequireRole izin="layanan"><KelolaLayanan /></RequireRole>} />
              <Route path="pengumuman" element={<RequireRole izin="pengumuman"><KelolaPengumuman /></RequireRole>} />
              <Route path="banner" element={<RequireRole izin="banner"><KelolaBanner /></RequireRole>} />
              <Route path="kontak" element={<RequireRole izin="kontak"><KelolaKontak /></RequireRole>} />
              <Route path="aset" element={<RequireRole izin="aset"><KelolaAset /></RequireRole>} />
              <Route path="dokumentasi" element={<RequireRole izin="dokumentasi"><KelolaDokumentasi /></RequireRole>} />
            </Route>

            {/* Dashboard admin (khusus admin) */}
            <Route path="/admin" element={<RequireRole roles={["tu"]} admin><AdminLayout /></RequireRole>}>
              <Route index element={<AdminDashboard />} />
              <Route path="akun" element={<KelolaAkun />} />
              <Route path="permintaan-reset" element={<PermintaanReset />} />
              <Route path="audit" element={<KelolaAudit />} />
            </Route>

            {/* Alamat lama: arahkan ke alamat baru */}
            <Route path="/admin/sk" element={<Navigate to="/tu/sk" replace />} />
            <Route path="/denah" element={<Navigate to="/layanan/aset" replace />} />
            <Route path="/admin/pegawai" element={<Navigate to="/tu/pegawai" replace />} />
            <Route path="/admin/pengumuman" element={<Navigate to="/tu/pengumuman" replace />} />

            {/* Halaman lain (denah, pengumuman, dst.) masih placeholder */}
            <Route path="{/* Halaman lain yang belum ada masih placeholder */}" element={<ComingSoon />} />
          </Routes>
          </PageTransition>
        </div>
        <Footer />
      </div>
    </>
  );
}
