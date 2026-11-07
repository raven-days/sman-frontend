import {
  Squares2X2Icon, ScaleIcon, UsersIcon, MegaphoneIcon, PhotoIcon,
  ClipboardDocumentListIcon, ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import PanelLayout from "./PanelLayout";

const MENU = [
  { to: "/tu", label: "Dashboard", icon: Squares2X2Icon, end: true },
  { to: "/petugas", label: "Antrian Pengajuan", icon: ClipboardDocumentListIcon, izin: "pengajuan" },
  { to: "/tu/sk", label: "Kelola SK", icon: ScaleIcon, izin: "sk" },
  { to: "/tu/pegawai", label: "Kelola Pegawai", icon: UsersIcon, izin: "pegawai" },
  { to: "/tu/pengumuman", label: "Kelola Pengumuman", icon: MegaphoneIcon, izin: "pengumuman" },
  { to: "/tu/banner", label: "Kelola Banner", icon: PhotoIcon, izin: "banner" },
  { to: "/admin", label: "Dashboard Admin", icon: ArrowsRightLeftIcon, admin: true },
];

export default function TuLayout() {
  return <PanelLayout judul="Dashboard staf TU" menu={MENU} />;
}