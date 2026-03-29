# Explanation: Backend Architecture

## Panoramica

Il backend usa architettura modulare NestJS con separazione controller/service.

- Controller: contratto HTTP e validazione input
- Service: logica applicativa e regole dominio
- PrismaService: accesso database via DI

## Flussi trasversali

### Auth e RBAC

- guard JWT globale (`JwtAuthGuard`)
- endpoint pubblici marcati `@Public()`
- autorizzazione ruolo con `@Roles(...)` + `RolesGuard`

### Contratto risposta

`TransformInterceptor` applica envelope uniforme:

- detail -> `{ data }`
- list -> `{ data, meta }`

### Error handling

- `GlobalExceptionFilter` per errori applicativi
- `PrismaExceptionFilter` per errori DB
- entrambe includono `requestId` per correlazione log

### Osservabilita operativa

- request ID middleware (`x-request-id`)
- request logging interceptor (JSON log strutturato)
- health endpoints (`liveness`, `readiness`)

### Audit

- eventi di business pushati in `AuditQueueService`
- processamento asincrono con drain best-effort in shutdown

## Pattern dominio coerente

Per risorse operative (`products`, `varieties`, `field-lots`, `processed-products`, `packagings`, `pallets`):

- active endpoints separati da trash endpoints
- soft delete come default
- restore esplicito
- purge hard-delete con reason obbligatoria
- blocco purge su referenze attive dove previsto

Per i campi `code` delle anagrafiche (`products`, `varieties`, `processed-products`, `packagings`):

- in soft delete il codice viene rinominato con suffisso `_del_<timestamp>` entro il cap tecnico di 32 caratteri
- il restore tenta di ripristinare il codice originale e fallisce con `409` se il codice e stato riutilizzato da un record attivo
