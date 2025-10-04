# Sistema di Autenticazione e Permessi

## Panoramica

Il sistema implementa un'architettura di autenticazione basata su JWT con refresh token, integrata con un sistema di autorizzazione granulare basato su permessi per client e istanze.

## 1. Processo di Login

### 1.1 Endpoint di Login

**Endpoint**: `POST /auth/login`

Il processo di login utilizza la strategia `LocalAuthGuard` che:
1. Valida le credenziali username/email e password
2. Genera access token e refresh token
3. Imposta il refresh token come cookie HTTP-only

```typescript
@UseGuards(LocalAuthGuard)
@Post("login")
async login(@Req() req: Request, @Res() res: Response) {
  return await this._login(req, res);
}
```

### 1.2 Validazione Credenziali

La validazione avviene nel `AuthService.validateUser()`:

```typescript
async validateUser(username: string, pass: string): Promise<User | null> {
  const user = 
    (await this.usersService.findOne(username)) ||
    (await this.usersService.findByEmail(username));

  if (user && (await bcrypt.compare(pass, user.get("password")))) {
    return user;
  }
  return null;
}
```

**Caratteristiche**:
- Supporta login con username o email
- Password hashate con bcrypt
- Ritorna `null` se le credenziali non sono valide

## 2. Struttura dei Token

### 2.1 Access Token

**Durata**: 15 minuti  
**Contenuto**:

```typescript
{
  sub: string,                    // User ID
  user: {                        // Dati utente (senza password)
    username: string,
    id: number,
    email: string,
    isSuperAdmin?: boolean
  },
  permissions: [                 // Permessi calcolati
    {
      client: number,
      instance?: number,
      permissions: [
        {
          permission: string,    // es: "segments.management"
          level: number         // 4=READ, 5=EXECUTE, 6=WRITE, 7=FULL
        }
      ]
    }
  ]
}
```

### 2.2 Refresh Token

**Durata**: 7 giorni  
**Contenuto**:

```typescript
{
  sub: string,                    // User ID
  user: Partial<User>            // Dati utente (senza password e permessi)
}
```

**Sicurezza**:
- Memorizzato come cookie HTTP-only
- Tracciato in Redis cache per invalidazione
- Configurazione cookie sicura:
  ```typescript
  .cookie("refreshToken", refreshToken, {
    httpOnly: true,     // Non accessibile da JavaScript
    secure: true,       // Solo HTTPS
    sameSite: "none",   // Cross-site requests
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 giorni
  })
  ```

### 2.3 Calcolo Permessi nell'Access Token

Durante il login, i permessi vengono calcolati per tutti i client e istanze:

```typescript
// Ottiene tutte le istanze e client
const instances = await this.instanceService.findAll();
let allvalues = instances.map(i => ({ instance: i.id, client: i.client}));
const clients = [...new Set(instances.map(instance => instance.get("client")))];
allvalues = allvalues.concat(clients.map(c => ({ client: c, instance: null})));

// Calcola permessi per ogni combinazione client/istanza
const permissionsP = allvalues.map((v) => {
  return this.permissionService.findUserPermissions(
    user.id,
    v.client,
    v.instance,
  );
});
```

## 3. Permission Guard

### 3.1 Configurazione

La `PermissionsGuard` è la guard principale per il controllo degli accessi:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
}
```

### 3.2 Logica di Controllo

Il controllo segue questa gerarchia:

1. **Super Admin**: Bypassa tutti i controlli
2. **Endpoint Super Admin Only**: Richiede flag `isSuperAdmin`
3. **Controllo Permessi**: Verifica permessi specifici per risorsa

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const user = request.user;
  
  // 1. Super Admin bypassa tutto
  if (user && user.user.isSuperAdmin) {
    return true;
  }

  // 2. Endpoint richiede Super Admin
  const isSuperAdminRequired = this.reflector.getAllAndOverride<boolean>(
    IS_SUPER_ADMIN_KEY,
    [context.getHandler(), context.getClass()],
  );
  
  if (isSuperAdminRequired) {
    throw new ForbiddenException("You must be a Super Admin to access this resource.");
  }

  // 3. Controllo permessi specifici
  const requirement = this.reflector.get<AccessRequirement>(
    PERMISSIONS_KEY,
    context.getHandler()
  );
  
  return PermissionsGuard.checkAccess(user, requirement.resourceType, requirement.permissions, clientId, instanceId);
}
```

### 3.3 Estrazione Parametri

La guard estrae automaticamente i parametri necessari da:
- URL parameters (`/clients/:id`)
- Query parameters (`?clientId=123`)
- Request body (POST/PUT/PATCH)
- Database lookup (tramite `resource` e `resourceIdParam`)

```typescript
private async extractParam(request: any, paramName: string, Resource?: ModelStatic<Model>, resourceId?: any): Promise<any> {
  // Se specificata una risorsa, fa lookup nel database
  if(Resource != null){
    const res = await Resource.findByPk(resourceId);
    if(!res) return undefined;
    return res.get(paramName);
  }

  // Altrimenti cerca nei parametri della request
  return request.params[paramName] || 
         request.query[paramName] || 
         request.body[paramName];
}
```

### 3.4 Controllo Accessi

Il controllo degli accessi distingue tra risorse CLIENT e INSTANCE:

```typescript
public static async checkAccess(
  user: any,
  resourceType: ResourceType,
  requiredPermissions: {permission: string, level: string}[],
  clientId?: number,
  instanceId?: number
): Promise<boolean> {
  
  switch (resourceType) {
    case ResourceType.INSTANCE:
      return this.hasInstanceAccess(user.permissions, instanceId, requiredPermissions);
    case ResourceType.CLIENT:
      return this.hasClientAccess(user.permissions, clientId, requiredPermissions);
    default:
      return true;
  }
}
```

**Gerarchia Permessi**:
- I permessi a livello INSTANCE hanno precedenza
- Se non ci sono permessi INSTANCE, controlla a livello CLIENT
- I permessi CLIENT si applicano a tutte le istanze del client

### 3.5 Livelli di Permesso

```typescript
private static checkLevel(level: number, requiredLevel: string): boolean {
  switch (requiredLevel) {
    case 'READ':    return [7,6,5,4].includes(level);  // Tutti i livelli
    case 'WRITE':   return [7,6].includes(level);      // Solo WRITE e FULL
    case 'EXECUTE': return [7,5].includes(level);      // Solo EXECUTE e FULL
    default:        return false;
  }
}
```

**Mappatura Livelli**:
- `4`: READ
- `5`: EXECUTE  
- `6`: WRITE
- `7`: FULL (READ + WRITE + EXECUTE)

## 4. Permission Decorator

### 4.1 Struttura

```typescript
export interface AccessRequirement {
  resourceType: ResourceType;           // CLIENT | INSTANCE | NONE
  clientIdParam?: string;              // Nome parametro client ID
  instanceIdParam?: string;            // Nome parametro instance ID
  resource?: ModelStatic<Model>;       // Modello per lookup database
  resourceIdParam?: string;            // Parametro ID risorsa
  permissions: {                       // Permessi richiesti
    permission: string, 
    level: string
  }[];
}
```

### 4.2 Esempi di Utilizzo

**Accesso a Client**:
```typescript
@Permissions({
  resourceType: ResourceType.CLIENT,
  clientIdParam: "id",
  permissions: [{permission: "client.management", level: PermissionLevel.READ}]
})
@Get(":id")
getClient(@Param("id") id: string) { ... }
```

**Accesso a Istanza**:
```typescript
@Permissions({
  resourceType: ResourceType.INSTANCE,
  instanceIdParam: "id", 
  permissions: [{permission: "segments.management", level: PermissionLevel.WRITE}]
})
@Post()
createSegment(@Body() createSegmentDto: CreateSegmentDto) { ... }
```

**Lookup da Risorsa**:
```typescript
@Permissions({
  resourceType: ResourceType.INSTANCE,
  resource: Segment,                    // Modello Segment
  resourceIdParam: "id",               // Parametro ID del segment
  permissions: [{permission: "segments.read", level: PermissionLevel.READ}]
})
@Get(":id")
getSegment(@Param("id") id: string) { ... }
```

In questo caso, la guard:
1. Estrae l'ID del segment dall'URL
2. Fa lookup nel database: `Segment.findByPk(id)`
3. Estrae `client` e `instance` dal record trovato
4. Verifica i permessi per quella combinazione

## 5. Access by Filter

### 5.1 FilterByAccess Decorator

Il decorator `@FilterByAccess` filtra automaticamente i risultati basandosi sui permessi dell'utente:

```typescript
export interface FilterConfig {
  permission: string;           // Permesso richiesto
  level: PermissionLevel;      // Livello richiesto
  instanceParam?: string;      // Campo instance (default: "instance")
  clientParam?: string;        // Campo client (default: "client")
}
```

### 5.2 Utilizzo

```typescript
@FilterByAccess({
  permission: "segments.read",
  level: PermissionLevel.READ,
  instanceParam: "instance",    // Campo nel risultato
  clientParam: "client"         // Campo nel risultato
})
@Get()
findAll() {
  return this.segmentsService.findAll();  // Ritorna tutti i segment
}
```

### 5.3 AccessFilterInterceptor

L'interceptor filtra automaticamente i risultati:

```typescript
@Injectable()
export class AccessFilterInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const config = this.reflector.get<FilterConfig>(FILTER_BY_ACCESS_KEY, context.getHandler());
    
    if (!config) return next.handle();
    
    const user = request.user;
    
    // Super admin vede tutto
    if (user.isSuperAdmin) return next.handle();
    
    // Filtra i risultati
    return next.handle().pipe(
      map(data => this.filterByAccess(data, user, config))
    );
  }
}
```

### 5.4 Logica di Filtro

```typescript
private async filterByAccess(data: any, user: any, config: FilterConfig) {
  if (Array.isArray(data)) {
    // Per array, filtra ogni elemento
    const dataFilter = await Promise.all(
      data.map(item => this.hasAccessToItem(item, user, config))
    );
    return data.filter((i,idx) => dataFilter[idx]);
  }
  
  // Per singolo oggetto
  return await this.hasAccessToItem(data, user, config) ? data : null;
}

private async hasAccessToItem(item: any, user, config: FilterConfig): Promise<boolean> {
  const instanceId = item[config.instanceParam!] || item.get(config.instanceParam);
  const clientId = item[config.clientParam!] || item.get(config.clientParam);
  
  if (instanceId != null) {
    return await PermissionsGuard.checkAccess(
      user, ResourceType.INSTANCE, [config], clientId, instanceId
    );
  } else if (clientId != null) {
    return await PermissionsGuard.checkAccess(
      user, ResourceType.CLIENT, [config], clientId
    );
  }
  
  return false;
}
```

## 6. Refresh Token

### 6.1 Endpoint Refresh

**Endpoint**: `POST /auth/refresh`

```typescript
@UseGuards(JwtRefreshGuard)
@Post("refresh")
async refresh(@Req() req: Request, @Res() res: Response) {
  return await this._login(req, res);  // Stesso processo del login
}
```

### 6.2 JwtRefreshStrategy

La strategia per il refresh token:

```typescript
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,                           // Da cookie
        ExtractJwt.fromAuthHeaderAsBearerToken()  // Da header Authorization
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
      passReqToCallback: true,
    });
  }
}
```

### 6.3 Validazione Refresh Token

```typescript
async validate(req: Request & { cookies: any }, payload: { sub: string; user: Partial<User> }) {
  const refreshToken = cookieExtractor(req) || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  
  if (!refreshToken) {
    throw new UnauthorizedException("Refresh token not found");
  }
  
  // Verifica esistenza in cache
  const cacheKey = `refreshToken:${refreshToken}`;
  const tokenExists = await this.cacheManager.get(cacheKey);
  
  if (!tokenExists || tokenExists !== payload.sub.toString()) {
    throw new UnauthorizedException("Invalid Token");
  }
  
  // Invalida il token usato (one-time use)
  await this.cacheManager.del(cacheKey);
  
  // Ritorna utente aggiornato
  return await this.usersService.findById(payload.user.id);
}
```

**Caratteristiche**:
- Refresh token è monouso (viene invalidato dopo l'uso)
- Verifica esistenza in Redis cache
- Ricarica dati utente aggiornati dal database
- Supporta estrazione da cookie o header Authorization

## 7. Logout

**Endpoint**: `GET /auth/logout`

```typescript
@Get("logout")
logout(@Res() res: Response) {
  res.clearCookie("refreshToken");
  return res.sendStatus(200);
}
```

Il logout semplicemente rimuove il cookie del refresh token. Il token rimane valido in cache fino alla scadenza naturale.

## 8. Configurazione Guards

Per utilizzare il sistema di permessi, configurare le guard nell'ordine corretto:

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AccessFilterInterceptor)  // Solo se serve filtro automatico
```

**Ordine importante**:
1. `JwtAuthGuard`: Valida e decodifica l'access token
2. `PermissionsGuard`: Controlla i permessi specifici
3. `AccessFilterInterceptor`: Filtra i risultati (opzionale)

## 9. Esempi Pratici

### 9.1 Endpoint con Permessi Semplici

```typescript
@Controller("clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  
  @Get(":id")
  @Permissions({
    resourceType: ResourceType.CLIENT,
    clientIdParam: "id",
    permissions: [{permission: "client.read", level: PermissionLevel.READ}]
  })
  findOne(@Param("id") id: string) {
    return this.clientsService.findOne(+id);
  }
}
```

### 9.2 Endpoint con Lookup Database

```typescript
@Get(":id")
@Permissions({
  resourceType: ResourceType.INSTANCE,
  resource: Segment,           // Modello per lookup
  resourceIdParam: "id",       // ID del segment
  permissions: [{permission: "segments.read", level: PermissionLevel.READ}]
})
getSegment(@Param("id") id: string) {
  return this.segmentsService.findOne(+id);
}
```

### 9.3 Endpoint con Filtro Automatico

```typescript
@Get()
@UseInterceptors(AccessFilterInterceptor)
@FilterByAccess({
  permission: "segments.read",
  level: PermissionLevel.READ
})
findAll() {
  return this.segmentsService.findAll();  // Ritorna solo segment accessibili
}
```

### 9.4 Endpoint Solo Super Admin

```typescript
@Post("system/reset")
@IsSuperAdmin()
@UseGuards(JwtAuthGuard, PermissionsGuard)
resetSystem() {
  return this.systemService.reset();
}
```

Questa documentazione copre tutti gli aspetti del sistema di autenticazione e permessi, dalla login alla gestione granulare degli accessi alle risorse.