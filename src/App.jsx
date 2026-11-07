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
import Kepegawaian from "./pages/Kepegawaian";
import SuratKeputusan from "./pages/SuratKeputusan";
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
            <Route path="/cek-status" element={<CekStatus />} />
            <Route path="/layanan" element={<LayananList />} />
            <Route path="/layanan/kepegawaian" element={<Kepegawaian />} />
            <Route path="/layanan/:slug" element={<LayananDetail />} />
            <Route path="/surat-keputusan" element={<SuratKeputusan />} />
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

            {/* Dashboard staf TU */}
            <Route path="/tu" element={<RequireRole roles={["tu"]}><TuLayout /></RequireRole>}>
              <Route index element={<TuDashboard />} />
              <Route path="sk" element={<RequireRole izin="sk"><KelolaSK /></RequireRole>} />
              <Route path="pegawai" element={<RequireRole izin="pegawai"><KelolaPegawai /></RequireRole>} />
              <Route path="pengumuman" element={<RequireRole izin="pengumuman"><KelolaPengumuman /></RequireRole>} />
              <Route path="banner" element={<RequireRole izin="banner"><KelolaBanner /></RequireRole>} />
   <Route path="kontak" element={<RequireRole izin="kontak"><KelolaKontak /></RequireRole>} />
            </Route>

            {/* Dashboard admin (khusus admin) */}
            <Route path="/admin" element={<RequireRole roles={["tu"]} admin><AdminLayout /></RequireRole>}>
              <Route index element={<AdminDashboard />} />
              <Route path="akun" element={<KelolaAkun />} />
              <Route path="audit" element={<KelolaAudit />} />
            </Route>

            {/* Alamat lama: arahkan ke alamat baru */}
            <Route path="/admin/sk" element={<Navigate to="/tu/sk" replace />} />
            <Route path="/admin/pegawai" element={<Navigate to="/tu/pegawai" replace />} />
            <Route path="/admin/pengumuman" element={<Navigate to="/tu/pengumuman" replace />} />
              <Route path="kontak" element={<RequireRole izin="kontak"><KelolaKontak /></RequireRole>} />

            {/* Halaman lain (denah, pengumuman, dst.) masih placeholder */}
            <Route path="*" element={<ComingSoon />} />
          </Routes>
          </PageTransition>
        </div>
        <Footer />
      </div>
    </>
  );
}
