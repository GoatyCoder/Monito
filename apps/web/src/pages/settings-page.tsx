import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { SlidersHorizontal, Save, Undo2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { showSuccess } from '@/lib/toast';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import type { UserPreferences } from '@monito/types';

const DEFAULT_SETTINGS: UserPreferences = {
  masterDataPageSize: 20,
  auditLogPageSize: 20,
};

export function SettingsPage() {
  const { preferences, refreshPreferences } = useAuth();
  const [settings, setSettings] = useState<UserPreferences>(preferences);
  const hasChanges = useMemo(
    () =>
      settings.masterDataPageSize !== preferences.masterDataPageSize ||
      settings.auditLogPageSize !== preferences.auditLogPageSize,
    [
      preferences.auditLogPageSize,
      preferences.masterDataPageSize,
      settings.auditLogPageSize,
      settings.masterDataPageSize,
    ],
  );

  useEffect(() => {
    setSettings(preferences);
  }, [preferences]);

  const saveSettings = async () => {
    await api.patch('/users/me/preferences', {
      masterDataPageSize: settings.masterDataPageSize,
      auditLogPageSize: settings.auditLogPageSize,
    });
    await refreshPreferences();
    showSuccess('Impostazioni salvate');
  };

  const resetSettings = async () => {
    await api.patch('/users/me/preferences', {
      masterDataPageSize: DEFAULT_SETTINGS.masterDataPageSize,
      auditLogPageSize: DEFAULT_SETTINGS.auditLogPageSize,
    });
    setSettings(DEFAULT_SETTINGS);
    await refreshPreferences();
    showSuccess('Impostazioni ripristinate');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6" id="main-content" role="main" aria-label="Impostazioni utente">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-foreground-muted">
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm">Preferenze</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-foreground-muted">Configura le preferenze reali dell&apos;interfaccia utente.</p>
      </header>

      <section className="rounded-md border border-border bg-surface p-4 space-y-4" aria-label="Preferenze liste">
        <h2 className="text-lg font-semibold text-foreground">Visualizzazione liste</h2>

        <div className="space-y-2">
          <Label htmlFor="settings-page-size">Dimensione pagina predefinita</Label>
          <select
            id="settings-page-size"
            value={settings.masterDataPageSize}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                masterDataPageSize: Number(e.target.value) as UserPreferences['masterDataPageSize'],
              }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={10}>10 righe</option>
            <option value={20}>20 righe</option>
            <option value={50}>50 righe</option>
            <option value={100}>100 righe</option>
          </select>
          <p className="text-xs text-foreground-muted">Applicata automaticamente alle pagine anagrafica. Audit log resta su 20 per default.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-audit-page-size">Dimensione pagina Audit log</Label>
          <select
            id="settings-audit-page-size"
            value={settings.auditLogPageSize}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                auditLogPageSize: Number(e.target.value) as UserPreferences['auditLogPageSize'],
              }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={10}>10 righe</option>
            <option value={20}>20 righe</option>
            <option value={50}>50 righe</option>
            <option value={100}>100 righe</option>
          </select>
          <p className="text-xs text-foreground-muted">Default 20, modificabile in base alle tue preferenze.</p>
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-4 space-y-3" aria-label="Navigazione account">
        <h2 className="text-lg font-semibold text-foreground">Account</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/profile">
            <Button variant="outline">
              <UserCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Apri profilo
            </Button>
          </Link>
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-4 space-y-3" aria-label="Idee impostazioni future">
        <h2 className="text-lg font-semibold text-foreground">Possibili impostazioni future</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-foreground-muted">
          <li>Ordinamento predefinito per ciascuna anagrafica</li>
          <li>Scelta landing page dopo login</li>
          <li>Preferenze notifiche (toast piu o meno verbosi)</li>
          <li>Preferenze accessibilita avanzate (dimensione font, riduzione movimento)</li>
        </ul>
      </section>

      <div className="flex items-center gap-2">
        <Button onClick={saveSettings} disabled={!hasChanges}>
          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          Salva impostazioni
        </Button>
        <Button variant="outline" onClick={resetSettings}>
          <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Ripristina predefinite
        </Button>
      </div>
    </div>
  );
}
