import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccessibilityPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="sm" aria-label="Torna alla dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </div>

      <article className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Dichiarazione di Accessibilità</h1>
          <p className="text-foreground-muted mt-2">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Stato di conformità</h2>
          <p className="text-foreground-muted">
            Monito si impegna a garantire l'accessibilità digitale secondo i seguenti standard:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground-muted">
            <li>
              <strong>WCAG 2.1 Livello AA</strong> — Linee guida per l'accessibilità dei contenuti Web
            </li>
            <li>
              <strong>European Accessibility Act (EN 301 549)</strong> — Requisiti di accessibilità per i prodotti e servizi ICT
            </li>
            <li>
              <strong>Legge 4/2004</strong> — Disposizioni per favorire l'accesso dei soggetti disabili agli strumenti informatici
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Funzionalità di accessibilità</h2>
          <p className="text-foreground-muted">
            L'applicazione Monito include le seguenti funzionalità di accessibilità:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground-muted">
            <li>Navigazione da tastiera completa per tutte le funzionalità</li>
            <li>Skip link per saltare la navigazione e accedere direttamente al contenuto principale</li>
            <li>Contraste cromatici conformi WCAG 2.1 AA</li>
            <li>Dimensioni del testo ridimensionabili</li>
            <li>Etichette e messaggi di errore descrittivi per i moduli</li>
            <li>Stati di caricamento comunicati agli assistivi tecnologici</li>
            <li>Struttura semantica corretta con uso appropriato di heading, liste e landmarks</li>
            <li>Messaggi di notifica (toast) annunciati agli screen reader</li>
            <li>Focus visibile su tutti gli elementi interattivi</li>
            <li>Supporto per la modalità ad alto contrasto</li>
            <li>Riduzione delle animazioni per utenti con sensibilità al movimento</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Tecnologie utilizzate</h2>
          <p className="text-foreground-muted">
            Monito si affida alle tecnologie HTML5, WAI-ARIA e CSS per garantire la compatibilità con le più diffuse tecnologie assistive.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Limitazioni note</h2>
          <p className="text-foreground-muted">
            Nonostante i nostri sforzi per garantire la piena accessibilità, potrebbero esistere alcune limitazioni:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground-muted">
            <li>Alcuni elementi grafici complessi potrebbero non essere pienamente accessibili</li>
            <li>Contenuti di terze parti incorporati nell'applicazione</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Feedback e contatti</h2>
          <p className="text-foreground-muted">
            Per segnalare problemi di accessibilità o richiedere informazioni, contattaci a:
          </p>
          <address className="not-italic text-foreground-muted">
            <p>Email: <a href="mailto:support@monito.it" className="text-primary hover:underline">support@monito.it</a></p>
          </address>
          <p className="text-foreground-muted">
            Ci impegniamo a rispondere entro 5 giorni lavorativi.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Procedura di feedback</h2>
          <p className="text-foreground-muted">
            Se riscontri barriere all'accessibilità che non sono elencate in questa pagina, ti preghiamo di:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-foreground-muted">
            <li>Inviare una segnalazione via email con oggetto "Accessibilità"</li>
            <li>Descrivere il problema riscontrato</li>
            <li>Indicare la pagina o funzionalità interessata</li>
            <li>Specificare la tecnologia assistive utilizzata (screen reader, browser, ecc.)</li>
          </ol>
        </section>
      </article>
    </div>
  );
}
