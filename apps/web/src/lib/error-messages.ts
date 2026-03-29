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
  PRODUCT_ALREADY_EXISTS: 'Prodotto con questo codice gia esistente',
  PRODUCT_NOT_FOUND: 'Prodotto non trovato',
  PACKAGING_ALREADY_EXISTS: 'Imballaggio con questo codice gia esistente',
  PACKAGING_NOT_FOUND: 'Imballaggio non trovato',
  PROCESSED_PRODUCT_ALREADY_EXISTS: 'Lavorato con questo codice gia esistente',
  PROCESSED_PRODUCT_NOT_FOUND: 'Lavorato non trovato',
  VARIETY_ALREADY_EXISTS: 'Varieta con questo codice gia esistente per il prodotto selezionato',
  VARIETY_NOT_FOUND: 'Varieta non trovata',
  PRODUCT_SUBTYPE_ALREADY_EXISTS: 'Sottotipologia con questo codice gia esistente per il prodotto selezionato',
  PRODUCT_SUBTYPE_NOT_FOUND: 'Sottotipologia non trovata',
  PALLET_NOT_FOUND: 'Pallet non trovato',
  PALLET_BAD_REQUEST: 'Dati pallet non validi',
};

export function translateErrorCode(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }

  return ERROR_MESSAGES_IT[code];
}
