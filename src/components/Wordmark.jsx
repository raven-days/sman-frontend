// Wordmark identitas layanan: LA + Sempat (Layanan 104).
// tone="terang" untuk latar terang, tone="gelap" untuk latar navy.
export default function Wordmark({ tone = "terang", className = "" }) {
  const la = tone === "gelap" ? "text-accent" : "text-primary";
  const sempat = tone === "gelap" ? "text-white" : "text-navy";

  return (
    <span className={`font-display leading-none tracking-[-0.02em] [font-stretch:125%] ${className}`}>
      <span className={`font-black ${la}`}>LA</span>
      <span className={`font-bold ${sempat}`}>Sempat</span>
    </span>
  );
}