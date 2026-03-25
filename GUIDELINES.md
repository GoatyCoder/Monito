# GUIDELINES.md — Backend & API

Linee guida tecniche di riferimento per lo sviluppo del backend NestJS.
Da leggere prima di iniziare a sviluppare qualsiasi feature.

---

## 1. Architettura generale

Il backend segue l'architettura a **moduli** di NestJS con separazione netta tra:

```
Controller  →  riceve la richiesta HTTP, delega al service
Service     →  contiene la business logic, parla con Prisma/Redis
Repository  →  (opzionale) astrazione sul db, utile per query complesse
```

Il flusso standard è:

```
Request → Guard → Interceptor → Pipe → Controller → Service → Prisma/Redis → Response
```

---

## 2. Struttura del monorepo

```
/
├── apps/
│   ├── api/                  # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── common/
│   │   │   ├── config/
│   │   │   ├── prisma/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/             # Test e2e
│   │   └── tsconfig.json
│   └── web/                  # Frontend React
├── packages/
│   └── shared/               # Tipi condivisi tra api e web
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docker-compose.yml
├── .env.example
├── pnpm-workspace.yaml
└── turbo.json                # (opzionale) se si usa Turborepo
```

---

## 3. Configurazione ambiente

### `.env.example`
```env
# App
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="file:./dev.db"          # SQLite dev
# DATABASE_URL="postgresql://..."     # PostgreSQL prod

# JWT
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_in_production
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGINS=http://localhost:5173
```

### ConfigModule
Usa `@nestjs/config` con validazione Joi o zod nello `AppModule`:
```ts
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    // ...
  }),
})
```

---

## 4. Prisma — convenzioni

### Schema
```prisma
// Naming: PascalCase per i modelli, camelCase per i campi
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")  // snake_case per la tabella nel DB
}

enum Role {
  USER
  ADMIN
}
```

### PrismaService
```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### IDs: CUID vs UUID
Prisma usa CUID (`@default(cuid())`), non UUID.

```typescript
// ✅ CORRETTO - usa @Param('id') senza pipe
@Get(':id')
findById(@Param('id') id: string) {}

// ❌ ERRATO - ParseUUIDPipe fallisce sempre con CUID
@Get(':id')
findById(@Param('id', ParseUUIDPipe) id: string) {}
```

```typescript
// ✅ CORRETTO - usa @IsString() per foreign keys
@IsString()
productId: string;

// ❌ ERRATO - @IsUUID() fallisce sempre con CUID
@IsUUID()
productId: string;
```

### PrismaService via DI

```typescript
// ✅ CORRETTO - inietta via DI
constructor(private readonly prisma: PrismaService) {}

// ❌ ERRATO - crea nuova connessione al DB
constructor() {
  const adapter = new PrismaLibSql({ url: ... });
  this.prisma = new PrismaClient({ adapter });
}
```

### Transazioni
```ts
// Per operazioni multi-step usa sempre $transaction
const [user, profile] = await this.prisma.$transaction([
  this.prisma.user.create({ data: userData }),
  this.prisma.profile.create({ data: profileData }),
]);
```

---

## 5. Autenticazione — flusso JWT

```
POST /auth/login    → restituisce { accessToken, refreshToken }
POST /auth/refresh  → accetta refreshToken, ruota e restituisce nuovi token
POST /auth/logout   → invalida il refreshToken (blacklist su Redis)
```

### Guard globale
In `main.ts` o `AppModule` registra `JwtAuthGuard` come guard globale.
Le rotte pubbliche usano il decorator `@Public()`:
```ts
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

### Struttura del payload JWT
```ts
interface JwtPayload {
  sub: string;     // userId
  username: string; // username dell'utente
  role: Role;
  iat: number;
  exp: number;
}
```

### Decorator `@CurrentUser()`
Crea un decorator per estrarre l'utente corrente dalla request:
```ts
@Get('me')
getMe(@CurrentUser() user: JwtPayload) {
  return this.usersService.findById(user.sub);
}
```

---

## 6. DTO e validazione

Ogni endpoint deve avere DTO separati per input e output.

```ts
// create-user.dto.ts
export class CreateUserDto {
  @ApiProperty({ example: 'mario@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

// user-response.dto.ts — mai restituire la password!
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  createdAt: Date;
}
```

Abilita in `main.ts`:
```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,       // rimuove campi non dichiarati nel DTO
    forbidNonWhitelisted: true,
    transform: true,       // trasforma automaticamente i tipi
  }),
);
```

---

## 7. Caching Redis

### Setup
```ts
// cache.module.ts
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: (config: ConfigService) => ({
    store: redisStore,
    host: config.get('REDIS_HOST'),
    port: config.get('REDIS_PORT'),
    ttl: 60, // default TTL in secondi
  }),
  inject: [ConfigService],
})
```

### Pattern di utilizzo
```ts
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findById(id: string) {
    const key = `user:${id}`;
    const cached = await this.cache.get<User>(key);
    if (cached) return cached;

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    await this.cache.set(key, user, 300); // TTL 5 minuti
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    await this.cache.del(`user:${id}`); // invalida cache
    return user;
  }
}
```

---

## 8. Formato risposte API

Usa un `TransformInterceptor` globale per standardizzare tutte le risposte:

```ts
// Successo — singolo
{ "data": { "id": "...", "email": "..." } }

// Successo — lista paginata
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}

// Errore
{
  "statusCode": 404,
  "message": "Utente non trovato",
  "error": "Not Found",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/users/123"
}
```

---

## 9. Paginazione

Crea un DTO generico per la paginazione:
```ts
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

---

## 10. Swagger

Configura Swagger in `main.ts` solo se `NODE_ENV !== 'production'`:
```ts
if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Internal API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

Ogni controller deve avere `@ApiTags('nome-risorsa')`.
Ogni endpoint deve avere `@ApiOperation` e almeno `@ApiResponse` per 200/201 e 4xx.

---

## 11. Testing

### Unit test (service)
```ts
describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should return user by id', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser);
    expect(await service.findById('1')).toEqual(mockUser);
  });
});
```

### E2e test
- Database: SQLite in memoria (`DATABASE_URL="file::memory:"`)
- Usa `supertest` per le chiamate HTTP
- Pulisci il DB prima di ogni test suite con `prisma.cleanDatabase()`

---

## 12. Docker Compose (sviluppo locale)

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

SQLite non necessita di un container — il file `.db` è in `prisma/`.

---

## 13. Checklist prima di ogni PR

- [ ] TypeScript compila senza errori (`pnpm build`)
- [ ] Tutti i test passano (`pnpm test`)
- [ ] Nessun `console.log` nel codice
- [ ] DTO aggiornati con decoratori Swagger
- [ ] Migration Prisma inclusa se lo schema è cambiato
- [ ] `.env.example` aggiornato se sono state aggiunte variabili
- [ ] Nessun segreto hardcodato
- [ ] Cache invalidata nelle operazioni di scrittura
- [ ] Nessun `ParseUUIDPipe` per campi CUID
- [ ] Nessun `@IsUUID()` nei DTOs per foreign keys
- [ ] Nessun `new PrismaClient()` nei service (usa `PrismaService`)
