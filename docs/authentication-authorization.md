# Authentication & Authorization

## Overview

The platform uses **JWT Bearer** authentication with **ASP.NET Core Identity** on the backend and a token-in-memory strategy on the Angular frontend. Two roles control access: `Admin` and `Operator`.

---

## Architecture

```
Frontend (Angular)
  LoginComponent ──POST /api/auth/login──► AuthController
                                               │
                                        AuthService (Infrastructure)
                                               │
                                        UserManager (Identity)
                                        ApplicationDbContext (PostgreSQL)
                                               │
                       ◄── { accessToken } ───┘
                       ◄── Set-Cookie: refreshToken (HttpOnly)

Subsequent requests:
  authInterceptor ──Bearer <accessToken>──► [Authorize] endpoints
  SignalRService  ──?access_token=<token>──► [Authorize] TelemetryHub
```

---

## Token Strategy

| Token | Lifetime | Storage | Transport |
|-------|----------|---------|-----------|
| Access token (JWT) | 15 minutes | Angular service memory | `Authorization: Bearer` header |
| Refresh token | 7 days | PostgreSQL (hashed with SHA-256) | HttpOnly cookie (`refreshToken`) |

**Why in-memory for the access token?** Storing tokens in `localStorage` exposes them to any JavaScript running on the page (XSS risk). Keeping the token in a service property means it is never accessible from outside the Angular app and is automatically cleared on page refresh — which is recovered by calling `/api/auth/refresh` using the HttpOnly cookie on app startup.

**Why hash the refresh token in the database?** A database breach would not expose usable refresh tokens. Only the raw token (sent in the cookie) can be used; the stored value is a one-way SHA-256 hash.

---

## Roles

| Role | Permissions |
|------|-------------|
| `Admin` | Full CRUD on geofences, can register new users, views telemetry |
| `Operator` | Read-only access to geofences, views telemetry |

New users can only be created by an `Admin` via `POST /api/auth/register`. There is no public self-registration.

---

## API Endpoints

### Auth endpoints (no token required)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | `{ email, password }` | Returns access token; sets `refreshToken` cookie |
| `POST` | `/api/auth/refresh` | — (cookie sent automatically) | Rotates refresh token; returns new access token |

### Auth endpoints (token required)

| Method | Path | Role | Body | Description |
|--------|------|------|------|-------------|
| `POST` | `/api/auth/register` | Admin | `{ email, password, role }` | Creates a new user |
| `POST` | `/api/auth/logout` | Any authenticated | — | Revokes refresh token; clears cookie |

### Protected endpoints

| Method | Path | Required role |
|--------|------|--------------|
| `GET` | `/api/geofence` | Any authenticated |
| `POST` | `/api/geofence` | Admin |
| `PUT` | `/api/geofence/{id}` | Admin |
| `PATCH` | `/api/geofence/{id}` | Admin |
| `DELETE` | `/api/geofence/{id}` | Admin |
| `WS` | `/hubs/telemetry` | Any authenticated |

### Public endpoints (no token required)

| Path | Purpose |
|------|---------|
| `GET /health` | Full health check |
| `GET /health/live` | Liveness probe |
| `GET /health/ready` | Readiness probe |

---

## Login Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "admin@catp.local",
  "role": "Admin"
}
```

The `refreshToken` is **not** in the JSON response — it is set as an HttpOnly cookie by the server.

---

## JWT Claims

| Claim | Value |
|-------|-------|
| `sub` | User ID (Identity GUID) |
| `email` | User's email address |
| `role` | `Admin` or `Operator` |
| `jti` | Unique token ID (for future revocation support) |

---

## Refresh Token Rotation

Every `/api/auth/refresh` call:
1. Validates the incoming raw token against the hashed value in the database.
2. Checks the token is not expired and not revoked.
3. Marks the old token as revoked (`IsRevoked = true`) and records `ReplacedByToken` for audit.
4. Generates a new raw token, hashes it, stores it.
5. Sets the new raw token as the `refreshToken` HttpOnly cookie.
6. Returns a new access token.

This means each refresh token is **single-use**. Replaying a stolen token after the legitimate client has refreshed will fail.

---

## Configuration

Settings in `backend/Api/appsettings.Development.json`:

```json
"Jwt": {
  "Secret": "<at-least-32-char-random-string>",
  "Issuer": "CriticalAssetTracking",
  "Audience": "CriticalAssetTrackingClients",
  "AccessTokenExpirationMinutes": 15,
  "RefreshTokenExpirationDays": 7
},
"Auth": {
  "DefaultAdminEmail": "admin@catp.local",
  "DefaultAdminPassword": "Admin@123!"
}
```

**Production:** Override `Jwt:Secret` and `Auth:DefaultAdminPassword` with environment variables. Never commit real secrets.

Docker environment variable names follow .NET's double-underscore convention:
```
Jwt__Secret=<secret>
Auth__DefaultAdminPassword=<password>
```

---

## Frontend Flow

### First page load (session restore)

```
App.ngOnInit()
  └─ authService.tryRestoreSession()     # POST /api/auth/refresh (cookie sent automatically)
       ├─ success → isAuthenticated$ = true → start SignalR
       └─ failure → redirect to /login
```

### Login

```
/login page
  └─ AuthService.login(email, password)  # POST /api/auth/login
       ├─ success → store accessToken in memory → navigate to /
       └─ failure → show error message
```

### Authenticated requests

```
Any HTTP call
  └─ authInterceptor
       ├─ adds Authorization: Bearer <accessToken>
       └─ on 401 → AuthService.refresh() → retry with new token
                     └─ refresh fails → logout + redirect to /login
```

### SignalR connection

```
AuthService.isAuthenticated$ emits true
  └─ SignalRService.startConnection(hubUrl)
       └─ HubConnectionBuilder.withUrl(url, {
            accessTokenFactory: () => authService.getAccessToken()
          })
       # SignalR sends token as ?access_token= query param (WebSocket can't set headers)
```

### Logout

```
User clicks Sign Out
  └─ AuthService.logout()                # POST /api/auth/logout (revokes DB token, clears cookie)
       └─ clear in-memory token → navigate to /login
```

---

## Key Files

### Backend

| File | Purpose |
|------|---------|
| [Infrastructure/Auth/AuthService.cs](../backend/Infrastructure/Auth/AuthService.cs) | Core auth logic — token generation, refresh rotation, logout |
| [Infrastructure/Auth/AdminSeeder.cs](../backend/Infrastructure/Auth/AdminSeeder.cs) | Seeds roles and default admin on startup |
| [Infrastructure/Identity/ApplicationUser.cs](../backend/Infrastructure/Identity/ApplicationUser.cs) | Identity user entity |
| [Infrastructure/Identity/RefreshToken.cs](../backend/Infrastructure/Identity/RefreshToken.cs) | Refresh token entity (stored hashed) |
| [Infrastructure/Settings/JwtSettings.cs](../backend/Infrastructure/Settings/JwtSettings.cs) | JWT config POCO |
| [Infrastructure/DependencyInjection.cs](../backend/Infrastructure/DependencyInjection.cs) | Registers Identity, JWT Bearer, `IAuthService` |
| [Api/Controllers/AuthController.cs](../backend/Api/Controllers/AuthController.cs) | Login / register / refresh / logout endpoints |
| [Api/Controllers/GeofenceController.cs](../backend/Api/Controllers/GeofenceController.cs) | Protected with `[Authorize]` and role checks |
| [Api/Hubs/TelemetryHub.cs](../backend/Api/Hubs/TelemetryHub.cs) | Protected with `[Authorize]` |
| [Application/Interfaces/IAuthService.cs](../backend/Application/Interfaces/IAuthService.cs) | Auth service contract (Application layer) |

### Frontend

| File | Purpose |
|------|---------|
| [src/app/services/auth.service.ts](../frontend/critical-asset-frontend/src/app/services/auth.service.ts) | Holds access token in memory; exposes `isAuthenticated$`, `currentUser$` |
| [src/app/interceptors/auth.interceptor.ts](../frontend/critical-asset-frontend/src/app/interceptors/auth.interceptor.ts) | Attaches Bearer token; handles silent refresh on 401 |
| [src/app/guards/auth.guard.ts](../frontend/critical-asset-frontend/src/app/guards/auth.guard.ts) | `authGuard` (any user) and `adminGuard` (Admin role) |
| [src/app/components/login/](../frontend/critical-asset-frontend/src/app/components/login/) | Login page (Angular Material form) |
| [src/app/app.routes.ts](../frontend/critical-asset-frontend/src/app/app.routes.ts) | Route config — `/login` public, `/` guarded |
| [src/app/app.config.ts](../frontend/critical-asset-frontend/src/app/app.config.ts) | Registers `authInterceptor` |

---

## Database Tables

ASP.NET Core Identity adds these tables automatically via the `AddIdentity` EF Core migration:

| Table | Contents |
|-------|----------|
| `AspNetUsers` | User accounts (`ApplicationUser`) |
| `AspNetRoles` | Role definitions (Admin, Operator) |
| `AspNetUserRoles` | User ↔ role mapping |
| `AspNetUserClaims` | Per-user claims (currently unused) |
| `AspNetUserLogins` | External login providers (currently unused) |
| `AspNetUserTokens` | Identity tokens (currently unused) |
| `AspNetRoleClaims` | Role-level claims (currently unused) |
| `RefreshTokens` | Hashed refresh tokens with expiry and revocation state |

---

## Adding a New User

Only an Admin can create users. Use the `/api/auth/register` endpoint with a valid Admin token:

```bash
# 1. Get admin token
curl -s -c cookies.txt -X POST http://localhost:5073/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@catp.local","password":"Admin@123!"}' | jq .accessToken

# 2. Register new operator
curl -X POST http://localhost:5073/api/auth/register \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"email":"operator@catp.local","password":"Op@12345!","role":"Operator"}'
```

---

## Security Considerations

- **Change the default admin password** immediately after first deployment.
- **`Jwt:Secret`** must be at least 32 characters and kept out of source control. Use a secrets manager or environment variables in production.
- The `Secure` flag on the `refreshToken` cookie requires HTTPS. In local HTTP development, the browser will not send it — run the backend with HTTPS (`https://localhost:7201`) or temporarily set `Secure = false` for local testing only.
- `ClockSkew` is set to zero — tokens expire exactly at 15 minutes. Ensure server clocks are synchronized (NTP) in distributed deployments.
