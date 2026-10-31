import { Link } from "react-router-dom";
import { LockClosedIcon } from "@heroicons/react/24/outline";

export default function Forbidden() {
  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-center px-5 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <LockClosedIcon className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold text-navy">Anda tidak memiliki akses</h1>
      <p className="mt-2 text-sm text-slate-600">
        Halaman ini tidak tersedia untuk peran akun Anda. Hak akses ditentukan oleh peran akun yang masuk.
      </p>
      <Link to="/akun" className="mt-7 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
        Kembali ke Akun Saya
      </Link>
    </div>
  );
}
