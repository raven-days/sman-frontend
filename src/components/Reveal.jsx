import { useEffect, useRef, useState } from "react";

export const kurangGerak = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Memunculkan isi dengan halus saat pertama kali terlihat di layar. Hanya sekali.
// Pakai: <Reveal delay={80}>...</Reveal>   atau   <Reveal as="li" className="...">
export default function Reveal({ as: Tag = "div", delay = 0, className = "", style, children, ...rest }) {
  const ref = useRef(null);
  const [tampil, setTampil] = useState(() => kurangGerak() || typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (tampil) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTampil(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [tampil]);

  return (
    <Tag
      ref={ref}
      style={{ ...style, "--reveal-delay": `${delay}ms` }}
      className={`reveal ${tampil ? "reveal-in" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}