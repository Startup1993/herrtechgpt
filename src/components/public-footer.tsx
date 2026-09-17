const LINKS = [
  { label: 'Impressum', href: 'https://herr.tech/impressum/' },
  { label: 'Datenschutz', href: 'https://herr.tech/datenschutz/' },
  { label: 'herr.tech', href: 'https://herr.tech/' },
]

// Footer für alle Seiten ohne Login (Login, Signup, Coming Soon).
// Pflichtangaben + erkennbarer Betreiber, damit Sicherheits-Scanner die
// Subdomain nicht als anonymes Datenerfassungs-Formular einstufen.
export function PublicFooter({ note }: { note?: string }) {
  return (
    <footer className="px-6 sm:px-10 py-8 text-center text-xs text-muted">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <span>
          © {new Date().getFullYear()} Herr Tech{note ? ` · ${note}` : ''}
        </span>
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
            {l.label}
          </a>
        ))}
      </div>
    </footer>
  )
}
