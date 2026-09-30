import { useRef, useState } from "react";
import { Arrow } from "./Arrow";
import { Brand } from "./Brand";

const links = [
  ["Denge Kasabası", "/denge-kasabasi"],
  ["Yaklaşımımız", "/#yaklasimimiz"],
  ["Ekip", "/#hakkimizda"],
  ["Eğitimciler", "/#egitimciler"],
  ["Kurumlar", "/kurumlar"],
  ["Blog", "/blog"],
  ["İletişim", "/#iletisim"],
];
export function Header({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="header">
      <div className="container header-inner">
        <Brand />
        <button
          ref={toggle}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? "Kapat ×" : "Menü ☰"}
        </button>
        <nav
          id="main-nav"
          aria-label="Ana navigasyon"
          className={open ? "nav open" : "nav"}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              toggle.current?.focus();
            }
          }}
        >
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              aria-current={current === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
              {label === "Denge Kasabası" && (
                <span className="nav-badge">YENİ</span>
              )}
              {label === "İletişim" && <Arrow />}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
