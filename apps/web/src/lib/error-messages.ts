const ERROR_MESSAGES_IT: Record<string, string> = {
  AUTH_USER_NOT_FOUND: 'Utente non esistente',
  AUTH_INVALID_PASSWORD: 'Password non corretta',
  AUTH_USER_DISABLED: 'Account disattivato',
  AUTH_INVALID_REFRESH_TOKEN: 'Sessione non valida. Effettua di nuovo l\'accesso',
  AUTH_REFRESH_REVOKED: 'Sessione scaduta. Effettua di nuovo l\'accesso',
  USER_ALREADY_EXISTS: 'Username gia in uso',
  USER_NOT_FOUND: 'Utente non trovato',
  VALIDATION_ERROR: 'Controlla i dati inseriti',
  RESOURCE_NOT_FOUND: 'Risorsa non trovata',
  CONFLICT: 'Operazione non consentita per conflitto dati',
  FIELD_LOT_ORIGIN_INVALID_COUNTRY: 'Codice paese di origine non valido',
  FIELD_LOT_ORIGIN_INVALID_REGION: 'Codice regione ISTAT non valido',
  FIELD_LOT_ORIGIN_INVALID_PROVINCE: 'Codice provincia ISTAT non valido',
  FIELD_LOT_ORIGIN_INVALID_COMUNE: 'Codice comune ISTAT non valido',
  FIELD_LOT_ORIGIN_INCOHERENT_REGION: 'Regione non coerente con il dato di origine selezionato',
  FIELD_LOT_ORIGIN_INCOHERENT_PROVINCE: 'Provincia non coerente con il comune selezionato',
};

export function translateErrorCode(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }

  return ERROR_MESSAGES_IT[code];
}
