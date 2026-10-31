import { Link } from "react-router-dom";
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from "@heroicons/react/24/outline";
import { CONTACT } from "../data/content";

const contacts = [
  { icon: MapPinIcon, text: CONTACT.alamat },
  { icon: PhoneIcon, text: CONTACT.telp, href: `tel:${CONTACT.telp.replace(/[^0-9+]/g, "")}` },
  { icon: EnvelopeIcon, text: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: ClockIcon, text: `Jam layanan: ${CONTACT.jam}` },
];

const quick = [
  { label: "Daftar Layanan", to: "/layanan" },
  { label: "Alur Pengajuan", to: "/#alur" },
  { label: "Surat Keputusan", to: "/surat-keputusan" },
  { label: "Cek Status", to: "/cek-status" },
  { label: "Kontak", to: "/kontak" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-blue-100">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold text-white">SMA Negeri 104 Jakarta</p>
          <p className="text-sm text-blue-200">Layanan Tata Usaha</p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-blue-200">
            Portal layanan administrasi sekolah: anggaran, aset, kepegawaian, administrasi &amp;
            persuratan, serta kebersihan &amp; keamanan dalam satu tempat.
          </p>
        </div>

        <div>
          <p className="mb-4 font-semibold text-white">Informasi Kontak</p>
          <ul className="space-y-3 text-sm">
            {contacts.map(({ icon: Icon, text, href }) => (
              <li key={text} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                {href ? (
                  <a href={href} className="hover:text-white">
                    {text}
                  </a>
                ) : (
                  <span>{text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 font-semibold text-white">Tautan Cepat</p>
          <ul className="space-y-2 text-sm">
            {quick.map((q) => (
              <li key={q.label}>
                <Link to={q.to} className="hover:text-white">
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-4 text-xs text-blue-300 sm:flex-row sm:justify-between sm:px-8">
          <span>© 2026 SMA Negeri 104 Jakarta. Hak cipta dilindungi.</span>
          <span>Dikelola oleh Tata Usaha SMAN 104 Jakarta</span>
        </div>
      </div>
    </footer>
  );
}
