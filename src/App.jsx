import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

const SEMUA = ["siswa", "guru", "tu"];

export default function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            {/* Halaman publik */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cek-status" element={<CekStatus />} />
            <Route path="/layanan" element={<LayananList />} />
            <Route path="/layanan/kepegawaian" element={<Kepegawaian />} />
            <Route path="/layanan/:slug" element={<LayananDetail />} />
            <Route path="/surat-keputusan" element={<SuratKeputusan />} />
            <Route path="/kontak" element={<Kontak />} />
            <Route path="/ajukan" element={<Ajukan />} />

            {/* Perlu masuk */}
            <Route path="/akun" element={<RequireRole roles={SEMUA}><Akun /></RequireRole>} />
            <Route path="/pengajuan" element={<RequireRole roles={["siswa", "guru"]}><PengajuanList /></RequireRole>} />
            <Route path="/pengajuan/:id" element={<RequireRole roles={SEMUA}><PengajuanDetail /></RequireRole>} />
            <Route path="/petugas" element={<RequireRole roles={["tu"]}><PetugasList /></RequireRole>} />
            <Route path="/petugas/:id" element={<RequireRole roles={["tu"]}><PetugasDetail /></RequireRole>} />

            {/* Halaman lain (denah, pengumuman, dst.) masih placeholder */}
            <Route path="*" element={<ComingSoon />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
