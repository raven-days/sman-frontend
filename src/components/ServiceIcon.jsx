import {
  BanknotesIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const MAP = {
  anggaran: BanknotesIcon,
  aset: ArchiveBoxIcon,
  kepegawaian: UserGroupIcon,
  "administrasi-persuratan": EnvelopeIcon,
  "kebersihan-keamanan": ShieldCheckIcon,
};

export default function ServiceIcon({ slug, className = "h-6 w-6" }) {
  const Icon = MAP[slug] || ArchiveBoxIcon;
  return <Icon className={className} />;
}
