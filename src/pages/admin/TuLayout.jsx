import {
  Squares2X2Icon, ScaleIcon, UsersIcon, MegaphoneIcon, PhotoIcon,
  ClipboardDocumentListIcon, ArrowsRightLeftIcon, ChatBubbleLeftRightIcon, ArchiveBoxIcon, AcademicCapIcon, BanknotesIcon, CameraIcon, AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import PanelLayout from "./PanelLayout";

const MENU = [
  { to: "/tu", label: "Dashboard", icon: Squares2X2Icon, end: true },
  { to: "/tu/layanan", label: "Akses Layanan", icon: AdjustmentsHorizontalIcon, izin: "layanan" },
  { to: "/petugas", label: "Antrian Pengajuan", icon: ClipboardDocumentListIcon, izin: "pengajuan" },
  { to: "/tu/sk", label: "Kelola SK & SOP", icon: ScaleIcon, izin: "sk" },
  { to: "/tu/pegawai", label: "Kelola Pegawai", icon: UsersIcon, izin: "pegawai" },
  { to: "/tu/pendidikan", label: "Kelola Pendidikan", icon: AcademicCapIcon, izin: "pendidikan" },{ to: "/tu/siswa", label: "Kelola Siswa", icon: AcademicCapIcon, izin: "siswa" },
  { to: "/tu/pengumuman", label: "Kelola Pengumuman", icon: MegaphoneIcon, izin: "pengumuman" },
  { to: "/tu/banner", label: "Kelola Banner", icon: PhotoIcon, izin: "banner" },
  { to: "/tu/aset", label: "Kelola Aset", icon: ArchiveBoxIcon, izin: "aset" },
  { to: "/tu/anggaran", label: "Kelola Anggaran", icon: BanknotesIcon, izin: "anggaran" },
  { to: "/tu/kontak", label: "Kontak & FAQ", icon: ChatBubbleLeftRightIcon, izin: "kontak" },
  { to: "/tu/dokumentasi", label: "Dokumentasi Fasilitas", icon: CameraIcon, izin: "dokumentasi" },
  { to: "/admin", label: "Dashboard Admin", icon: ArrowsRightLeftIcon, admin: true },
];

export default function TuLayout() {
  return <PanelLayout judul="Dashboard staf TU" menu={MENU} />;
}