import { Squares2X2Icon, UserGroupIcon, ShieldCheckIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import PanelLayout from "./PanelLayout";

const MENU = [
  { to: "/admin", label: "Dashboard", icon: Squares2X2Icon, end: true },
  { to: "/admin/akun", label: "Kelola Akun", icon: UserGroupIcon },
  { to: "/admin/audit", label: "Log Audit", icon: ShieldCheckIcon },
  { to: "/tu", label: "Dashboard Staf TU", icon: ArrowsRightLeftIcon },
];

export default function AdminLayout() {
  return <PanelLayout judul="Dashboard admin" menu={MENU} />;
}