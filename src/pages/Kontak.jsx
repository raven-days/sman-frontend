import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from "@heroicons/react/24/outline";
import { CONTACT } from "../data/content";

export default function Kontak() {
  const items = [
    { icon: MapPinIcon, label: "Alamat", value: CONTACT.alamat },
    { icon: PhoneIcon, label: "Telepon", value: CONTACT.telp, href: `tel:${CONTACT.telp.replace(/[^0-9+]/g, "")}` },
    { icon: EnvelopeIcon, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: ClockIcon, label: "Jam layanan", value: CONTACT.jam },
  ];
  return (
    <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-8">
      <h1 className="text-3xl font-extrabold text-navy">Kontak</h1>
      <p className="mt-1 text-sm text-slate-600">Hubungi Tata Usaha SMA Negeri 104 Jakarta.</p>
      <ul className="mt-8 divide-y divide-line rounded-xl border border-line bg-white">
        {items.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary"><Icon className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              {href ? <a href={href} className="font-semibold text-navy hover:text-primary">{value}</a> : <p className="font-semibold text-navy">{value}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
