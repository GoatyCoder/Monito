# Documentazione Backend API

Questa cartella contiene la documentazione ufficiale del backend `apps/api`.

Note rapide:

- Le liste standard sono paginate (`page`, `limit`, cap `limit=100`).
- Per lookup frontend esistono endpoint non paginati `GET /resource/all` sui moduli anagrafica principali.
- Per i campi `code` (products, product-subtypes, varieties, processed-products, packagings): input max `14`, con rename soft-delete `_del_<timestamp>` entro il limite DB `32`.

- Tutorial: `apps/api/docs/tutorial/quickstart-local.md`
- How-to: `apps/api/docs/how-to/operations.md`
- Reference API: `apps/api/docs/reference/api-endpoints.md`
- Reference configurazione: `apps/api/docs/reference/configuration.md`
- Reference schema DB: `apps/api/docs/reference/database-schema.md`
- Reference testing: `apps/api/docs/reference/testing.md`
- Explanation architettura: `apps/api/docs/explanation/backend-architecture.md`
- Checklist go-live: `apps/api/docs/backend-go-live-checklist.md`
