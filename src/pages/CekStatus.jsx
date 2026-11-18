import CekStatusPanel from "../components/CekStatusPanel";

export default function CekStatus() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Layanan publik</p>
      <div className="mt-3">
        <CekStatusPanel />
      </div>
    </div>
  );
}