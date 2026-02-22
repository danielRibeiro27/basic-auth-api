# basic-auth-api
Authn + Authz with node.js/express
basic-auth-api — Authn vs Authz Board
1. Project Goal

Build the simplest possible real-world authentication + authorization system to clearly understand the difference between:

Authentication (Authn): who you are

Authorization (Authz): what you are allowed to access

This project intentionally avoids OAuth, OIDC, JWT, SSO, and federation.

2. Project Role

Service Provider (SP) only.

The API authenticates users with credentials

The API authorizes requests using API keys

The API does not act as an Identity Provider (IdP)

3. In Scope
Authentication (Authn)

Single-factor authentication (knowledge factor)

Username + password

HTTP Basic Auth (used only on login)

Authorization (Authz)

API Key (bearer secret)

Key-based access to protected endpoints

Key revocation and usage tracking

Security Fundamentals

Password hashing (bcrypt / argon2)

API key hashing (SHA-256)

Constant-time comparisons

Proper HTTP status codes

4. Out of Scope (Explicit)

OAuth 2.0

OpenID Connect (OIDC)

JWT

SSO

SAML

MFA / 2FA

Federation

JAR / PAR

5. Domain Model
users

id (uuid)

email (unique)

password_hash

created_at

api_keys

id (uuid)

user_id (fk)

key_hash (SHA-256)

prefix (first 8 chars)

created_at

revoked_at (nullable)

last_used_at (nullable)

Rules:

Raw passwords are never stored

Raw API keys are never stored

6. API Endpoints
Public

POST /users

Create user

POST /login

Uses HTTP Basic Auth

Issues a new API key

Protected (API key required)

GET /me

POST /api-keys/revoke

7. Authentication Flow (Login)
sequenceDiagram
  autonumber
  participant C as Client
  participant API as Auth API
  participant DB as Database


  C->>API: POST /login (Basic Auth)
  API->>DB: Fetch user by email
  API->>API: Verify password hash
  API->>DB: Store hashed API key
  API-->>C: Return raw API key (once)
8. Authorization Flow (Protected Request)
sequenceDiagram
  autonumber
  participant C as Client
  participant API as Auth API
  participant DB as Database


  C->>API: Request with X-API-Key
  API->>DB: Validate key hash (not revoked)
  API->>DB: Update last_used_at
  API-->>C: Protected response
9. Authorization Rules

Missing API key → 401

Invalid API key → 401

Revoked API key → 401

Valid API key → request allowed

10. Test Assertions (Minimum)
Login

No Basic Auth → 401

Wrong password → 401

Correct credentials → 200 + API key

Protected endpoints

No API key → 401

Invalid API key → 401

Revoked API key → 401

Valid API key → 200

Persistence

users.email is unique

API key stored only as hash

last_used_at updates on use

11. Learning Outcomes

By completing this project, you will understand:

The hard boundary between Authn and Authz

Why API keys are authorization, not authentication

Why identity systems are separate products

Why OAuth/OIDC are not "simple auth"

12. Next Steps (Optional, Separate Projects)

JWT-based auth without OAuth

OIDC resource server (Keycloak)

OAuth scopes & RBAC/ABAC




============================================================================================================
                    ============== Authentication vs. Authorization ==============
                    30% of cyberattacks uses identity teft

                    auth limites access 
                    authz limites the damage

                    ====== Authn: who are you ? uses credentials, auth factor ======
                    1. knowledge factors
                    2. posession factors (PIN, OTP, token)
                    3. Inherent factors: biometrics (facial or fingerprint)

                    SSO

                    ====== SAML XML messages to share auth vs OIDC JWTS id tokens ======
                    Federated Identity, IdP <-> Service Provider enables SSO
                    SAML 2002
                    OIDC 2014

                    SAML XML ASSERTIONS (SOAP XML AND BROWSER REDIRECTS HTTP POST)

                    SAML FLOW:
                    ┌───────────────┐
                    │      App      │
                    └───────┬───────┘
                            │
                                    │  SAML AuthnRequest
                                            ▼
                                            ┌─────────────────────────┐
                                            │  Redirect to IdP SSO URL│
                                            └───────┬─────────────────┘
                                                    │
                                                            │  User login
                                                                    ▼
                                                                    ┌───────────────┐
                                                                    │      IdP      │
                                                                    └───────┬───────┘
                                                                            │
                                                                                    │  POST SAML Response
                                                                                            │  to ACS
                                                                                                    ▼
                                                                                                    ┌───────────────┐
                                                                                                    │      App      │
                                                                                                    └───────┬───────┘
                                                                                                            │
                                                                                                                    │  Verify assertion
                                                                                                                            │  Extract attributes
                                                                                                                                    ▼
                                                                                                                                    ┌────────────────┐
                                                                                                                                    │ Authenticated  │
                                                                                                                                    └────────────────┘

                                                                                                                                    OIDC FLOW:
                                                                                                                                    ┌───────────────┐
                                                                                                                                    │      App      │
                                                                                                                                    └───────┬───────┘
                                                                                                                                            │
                                                                                                                                                    │  /authorize
                                                                                                                                                            ▼
                                                                                                                                                            ┌───────────────────────┐
                                                                                                                                                            │ User login + consent  │
                                                                                                                                                            └───────┬───────────────┘
                                                                                                                                                                    │
                                                                                                                                                                            │  Redirect with
                                                                                                                                                                                    │  id_token + access_token
                                                                                                                                                                                            ▼
                                                                                                                                                                                            ┌───────────────┐
                                                                                                                                                                                            │      App      │
                                                                                                                                                                                            └───────┬───────┘
                                                                                                                                                                                                    │
                                                                                                                                                                                                            │  Token validated
                                                                                                                                                                                                                    ▼
                                                                                                                                                                                                                    ┌────────────────┐
                                                                                                                                                                                                                    │ Authenticated  │
                                                                                                                                                                                                                    └────────────────┘

                                                                                                                                                                                                                    # OIDC — exemplo concreto de vida real (arquivo)

                                                                                                                                                                                                                    ## Cenário realista
                                                                                                                                                                                                                    Um app web (frontend) + API (backend) usa **Keycloak** (ou Auth0/Entra ID) como provedor OIDC.  
                                                                                                                                                                                                                    Objetivo: login do usuário e acesso à API com **Access Token (JWT)**.

                                                                                                                                                                                                                    - **OP/IdP:** Keycloak (OpenID Provider)
                                                                                                                                                                                                                    - **Client:** Web app (SPA ou server-rendered)
                                                                                                                                                                                                                    - **Resource Server:** API (Express/.NET/etc.)

                                                                                                                                                                                                                    ## Conceitos rápidos (o que importa)
                                                                                                                                                                                                                    - **ID Token:** prova autenticação (quem é o usuário) — normalmente usado no client/app
                                                                                                                                                                                                                    - **Access Token:** usado para chamar a API (autorização)
                                                                                                                                                                                                                    - **Refresh Token:** renovar access token (quando aplicável)

                                                                                                                                                                                                                    ## Fluxo típico (Authorization Code + PKCE) — o “padrão moderno”
                                                                                                                                                                                                                    1. Usuário clica “Login”
                                                                                                                                                                                                                    2. Client redireciona para `/authorize` com `code_challenge` (PKCE)
                                                                                                                                                                                                                    3. Usuário autentica (senha/MFA)
                                                                                                                                                                                                                    4. OP redireciona de volta com `code`
                                                                                                                                                                                                                    5. Client troca `code` por tokens em `/token` (inclui `code_verifier`)
                                                                                                                                                                                                                    6. Client chama a API com `Authorization: Bearer <access_token>`
                                                                                                                                                                                                                    7. API valida assinatura JWT + issuer + audience + scopes

                                                                                                                                                                                                                    ## Discovery (arquivo real que existe)
                                                                                                                                                                                                                    O OP publica o documento `.well-known/openid-configuration`:

                                                                                                                                                                                                                    Exemplo (formato real; valores mudam por ambiente):
                                                                                                                                                                                                                    ```json
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                      "issuer": "https://sso.empresa.com/realms/acme",
                                                                                                                                                                                                                        "authorization_endpoint": "https://sso.empresa.com/realms/acme/protocol/openid-connect/auth",
                                                                                                                                                                                                                          "token_endpoint": "https://sso.empresa.com/realms/acme/protocol/openid-connect/token",
                                                                                                                                                                                                                            "jwks_uri": "https://sso.empresa.com/realms/acme/protocol/openid-connect/certs",
                                                                                                                                                                                                                              "userinfo_endpoint": "https://sso.empresa.com/realms/acme/protocol/openid-connect/userinfo"
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                              ```

                                                                                                                                                                                                                              ## Requisição real para /authorize (exemplo)
                                                                                                                                                                                                                              > Isso acontece via redirect do browser.

                                                                                                                                                                                                                              ```http
                                                                                                                                                                                                                              GET /realms/acme/protocol/openid-connect/auth?
                                                                                                                                                                                                                                client_id=web-app&
                                                                                                                                                                                                                                  response_type=code&
                                                                                                                                                                                                                                    redirect_uri=https%3A%2F%2Fapp.empresa.com%2Fcallback&
                                                                                                                                                                                                                                      scope=openid%20profile%20email&
                                                                                                                                                                                                                                        state=9b2f3c...&
                                                                                                                                                                                                                                          code_challenge=Kk4...&
                                                                                                                                                                                                                                            code_challenge_method=S256
                                                                                                                                                                                                                                            Host: sso.empresa.com
                                                                                                                                                                                                                                            ```

                                                                                                                                                                                                                                            ## Troca real em /token (exemplo)
                                                                                                                                                                                                                                            ```http
                                                                                                                                                                                                                                            POST /realms/acme/protocol/openid-connect/token
                                                                                                                                                                                                                                            Host: sso.empresa.com
                                                                                                                                                                                                                                            Content-Type: application/x-www-form-urlencoded

                                                                                                                                                                                                                                            grant_type=authorization_code&
                                                                                                                                                                                                                                            client_id=web-app&
                                                                                                                                                                                                                                            code=SplxlOBeZQQYbYS6WxSbIA&
                                                                                                                                                                                                                                            redirect_uri=https%3A%2F%2Fapp.empresa.com%2Fcallback&
                                                                                                                                                                                                                                            code_verifier=Zx9...
                                                                                                                                                                                                                                            ```

                                                                                                                                                                                                                                            Resposta (exemplo realista):
                                                                                                                                                                                                                                            ```json
                                                                                                                                                                                                                                            {
                                                                                                                                                                                                                                              "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9....",
                                                                                                                                                                                                                                                "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9....",
                                                                                                                                                                                                                                                  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9....",
                                                                                                                                                                                                                                                    "expires_in": 300,
                                                                                                                                                                                                                                                      "token_type": "Bearer",
                                                                                                                                                                                                                                                        "scope": "openid profile email"
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                        ```

                                                                                                                                                                                                                                                        ## O que a API valida (mínimo) em cada request
                                                                                                                                                                                                                                                        - `Authorization: Bearer <access_token>`
                                                                                                                                                                                                                                                        - Assinatura do JWT usando o **JWKS** (`jwks_uri`)
                                                                                                                                                                                                                                                        - `iss` (issuer) = OP esperado
                                                                                                                                                                                                                                                        - `aud` (audience) = sua API / client configurado
                                                                                                                                                                                                                                                        - `exp` / `nbf`
                                                                                                                                                                                                                                                        - Escopos/roles (ex.: `scope` ou `roles`) para autorização

                                                                                                                                                                                                                                                        ## Exemplo real de payload JWT (decodificado)
                                                                                                                                                                                                                                                        ```json
                                                                                                                                                                                                                                                        {
                                                                                                                                                                                                                                                          "iss": "https://sso.empresa.com/realms/acme",
                                                                                                                                                                                                                                                            "sub": "0f3a1b4e-....",
                                                                                                                                                                                                                                                              "aud": "acme-api",
                                                                                                                                                                                                                                                                "exp": 1764936000,
                                                                                                                                                                                                                                                                  "scope": "openid profile email",
                                                                                                                                                                                                                                                                    "email": "daniel@empresa.com.br",
                                                                                                                                                                                                                                                                      "realm_access": { "roles": ["payments:read", "payments:write"] }
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                      ```

                                                                                                                                                                                                                                                                      ## Onde OIDC aparece “no mundo real”
                                                                                                                                                                                                                                                                      - Login em apps web/mobile modernos
                                                                                                                                                                                                                                                                      - API gateway / microservices com JWT
                                                                                                                                                                                                                                                                      - Integração com Entra ID, Google, Okta, Auth0, Keycloak
                                                                                                                                                                                                                                                                      - Cenários com **scopes/roles** (autorização)

                                                                                                                                                                                                                                                                      ## Nota prática (diferença chave vs SAML)
                                                                                                                                                                                                                                                                      - OIDC é “web/API-friendly”: JSON/JWT e discovery automático.
                                                                                                                                                                                                                                                                      - SAML é mais comum em SSO enterprise legado (XML assertions).

                                                                                                                                                                                                                                                                      # SAML — exemplo concreto de vida real (arquivo)

                                                                                                                                                                                                                                                                      ## Cenário realista
                                                                                                                                                                                                                                                                      Uma empresa usa **Microsoft Entra ID (Azure AD)** como provedor de identidade corporativo (IdP) e um SaaS (ex.: “AcmeHR”) como provedor de serviço (SP).  
                                                                                                                                                                                                                                                                      Objetivo: **SSO** para funcionários acessarem o SaaS com a conta corporativa.

                                                                                                                                                                                                                                                                      - **IdP:** Microsoft Entra ID (Azure AD)
                                                                                                                                                                                                                                                                      - **SP:** SaaS (AcmeHR) com SAML 2.0
                                                                                                                                                                                                                                                                      - **Usuário:** funcionário logado no Windows/Google Workspace, etc.

                                                                                                                                                                                                                                                                      ## Fluxo típico (SP-initiated SSO)
                                                                                                                                                                                                                                                                      1. Usuário abre `https://acmehr.com`
                                                                                                                                                                                                                                                                      2. SP redireciona para o IdP com um `SAMLRequest` (AuthnRequest) via Redirect binding
                                                                                                                                                                                                                                                                      3. IdP autentica o usuário (senha, MFA, device compliance)
                                                                                                                                                                                                                                                                      4. IdP envia `SAMLResponse` (assertion) para o SP via POST para o **ACS URL**
                                                                                                                                                                                                                                                                      5. SP valida assinatura, audience, issuer, condições de tempo, etc.
                                                                                                                                                                                                                                                                      6. SP cria sessão e libera acesso

                                                                                                                                                                                                                                                                      ## O que o SP valida (mínimo)
                                                                                                                                                                                                                                                                      - Assinatura do IdP (certificado X.509)
                                                                                                                                                                                                                                                                      - `Issuer` (IdP esperado)
                                                                                                                                                                                                                                                                      - `Audience` (EntityID do SP)
                                                                                                                                                                                                                                                                      - `Destination` (ACS correto)
                                                                                                                                                                                                                                                                      - `InResponseTo` (se você guardar state)
                                                                                                                                                                                                                                                                      - `NotBefore` / `NotOnOrAfter`
                                                                                                                                                                                                                                                                      - `NameID` e/ou atributos (email, groups)

                                                                                                                                                                                                                                                                      ## Config “de verdade” (campos que você configura no IdP)
                                                                                                                                                                                                                                                                      No Entra ID, você normalmente configura:
                                                                                                                                                                                                                                                                      - **Identifier (Entity ID do SP):** `https://acmehr.com/saml/metadata`
                                                                                                                                                                                                                                                                      - **Reply URL (ACS):** `https://acmehr.com/saml/acs`
                                                                                                                                                                                                                                                                      - **Sign-on URL:** `https://acmehr.com/login/sso`
                                                                                                                                                                                                                                                                      - **User Attributes & Claims:** email, name, groups, employeeId

                                                                                                                                                                                                                                                                      ## Exemplo de metadados do SP (SP Metadata) — recorte
                                                                                                                                                                                                                                                                      > Isso é o arquivo que um SaaS geralmente fornece para você subir no IdP.

                                                                                                                                                                                                                                                                      ```xml
                                                                                                                                                                                                                                                                      <EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                                                                                                                                                                                                                                                                        entityID="https://acmehr.com/saml/metadata">
                                                                                                                                                                                                                                                                          <SPSSODescriptor AuthnRequestsSigned="true" WantAssertionsSigned="true"
                                                                                                                                                                                                                                                                              protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">

                                                                                                                                                                                                                                                                                  <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>

                                                                                                                                                                                                                                                                                      <AssertionConsumerService
                                                                                                                                                                                                                                                                                            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                                                                                                                                                                                                                                                                                  Location="https://acmehr.com/saml/acs"
                                                                                                                                                                                                                                                                                                        index="0" isDefault="true" />

                                                                                                                                                                                                                                                                                                          </SPSSODescriptor>
                                                                                                                                                                                                                                                                                                          </EntityDescriptor>
                                                                                                                                                                                                                                                                                                          ```

                                                                                                                                                                                                                                                                                                          ## Exemplo de “SAMLResponse” (Assertion) — versão curta e legível
                                                                                                                                                                                                                                                                                                          > Na prática o SAMLResponse é base64+deflate/POST. Aqui é uma versão “human readable”.

                                                                                                                                                                                                                                                                                                          ```xml
                                                                                                                                                                                                                                                                                                          <samlp:Response>
                                                                                                                                                                                                                                                                                                            <saml:Issuer>https://sts.windows.net/{tenant-id}/</saml:Issuer>

                                                                                                                                                                                                                                                                                                              <saml:Assertion>
                                                                                                                                                                                                                                                                                                                  <saml:Subject>
                                                                                                                                                                                                                                                                                                                        <saml:NameID>daniel@empresa.com.br</saml:NameID>
                                                                                                                                                                                                                                                                                                                              <saml:SubjectConfirmation>
                                                                                                                                                                                                                                                                                                                                      <saml:SubjectConfirmationData Recipient="https://acmehr.com/saml/acs"
                                                                                                                                                                                                                                                                                                                                                NotOnOrAfter="2026-02-01T05:05:00Z"/>
                                                                                                                                                                                                                                                                                                                                                      </saml:SubjectConfirmation>
                                                                                                                                                                                                                                                                                                                                                          </saml:Subject>

                                                                                                                                                                                                                                                                                                                                                              <saml:Conditions NotBefore="2026-02-01T05:00:00Z" NotOnOrAfter="2026-02-01T06:00:00Z">
                                                                                                                                                                                                                                                                                                                                                                    <saml:AudienceRestriction>
                                                                                                                                                                                                                                                                                                                                                                            <saml:Audience>https://acmehr.com/saml/metadata</saml:Audience>
                                                                                                                                                                                                                                                                                                                                                                                  </saml:AudienceRestriction>
                                                                                                                                                                                                                                                                                                                                                                                      </saml:Conditions>

                                                                                                                                                                                                                                                                                                                                                                                          <saml:AttributeStatement>
                                                                                                                                                                                                                                                                                                                                                                                                <saml:Attribute Name="email"><saml:AttributeValue>daniel@empresa.com.br</saml:AttributeValue></saml:Attribute>
                                                                                                                                                                                                                                                                                                                                                                                                      <saml:Attribute Name="given_name"><saml:AttributeValue>Daniel</saml:AttributeValue></saml:Attribute>
                                                                                                                                                                                                                                                                                                                                                                                                            <saml:Attribute Name="groups"><saml:AttributeValue>HR-Admins</saml:AttributeValue></saml:Attribute>
                                                                                                                                                                                                                                                                                                                                                                                                                </saml:AttributeStatement>

                                                                                                                                                                                                                                                                                                                                                                                                                  </saml:Assertion>
                                                                                                                                                                                                                                                                                                                                                                                                                  </samlp:Response>
                                                                                                                                                                                                                                                                                                                                                                                                                  ```

                                                                                                                                                                                                                                                                                                                                                                                                                  ## Onde SAML aparece “no mundo real”
                                                                                                                                                                                                                                                                                                                                                                                                                  - SaaS corporativo (HR, CRM, ERP, BI) com SSO enterprise
                                                                                                                                                                                                                                                                                                                                                                                                                  - Acesso a apps internos via IdP (Entra/Okta)
                                                                                                                                                                                                                                                                                                                                                                                                                  - Cenários com **atributos** e **grupos** para autorização no app

                                                                                                                                                                                                                                                                                                                                                                                                                  ## Nota prática (diferença chave vs OIDC)
                                                                                                                                                                                                                                                                                                                                                                                                                  - SAML é baseado em **XML Assertions** e é comum em SSO enterprise “antigo”, mas ainda muito usado.
                                                                                                                                                                                                                                                                                                                                                                                                                  - OIDC (BASE64) usa **JWT/JSON** e é mais natural para APIs e mobile.

                                                                                                                                                                                                                                                                                                                                                                                                                  OIDC uses JSON + REST
                                                                                                                                                                                                                                                                                                                                                                                                                  OpenID its built on OAUTH2.0 

                                                                                                                                                                                                                                                                                                                                                                                                                  JWTS Identity Claims
                                                                                                                                                                                                                                                                                                                                                                                                                  OAUTH its a authori not authn
                                                                                                                                                                                                                                                                                                                                                                                                                  OIDC(OpenID) enables authorization
                                                                                                                                                                                                                                                                                                                                                                                                                  OIDC its necessary for user auth, not for simple service communication authn

                                                                                                                                                                                                                                                                                                                                                                                                                  flow client -> authn and autz request -> server auth endpoint authn + authz sends back auth coded -> token request (id + access token)

                                                                                                                                                                                                                                                                                                                                                                                                                  openid-configuration discovery endpoint

                                                                                                                                                                                                                                                                                                                                                                                                                  JAR and PAR address security issues in OAuth
                                                                                                                                                                                                                                                                                                                                                                                                                  JAR (JWT, JWE, JWS)

                                                                                                                                                                                                                                                                                                                                                                                                                  Transport mechanism and api
                                                                                                                                                                                                                                                                                                                                                                                                                  SAML use browsers redirections and post forms
                                                                                                                                                                                                                                                                                                                                                                                                                  OIDC REST + JSON

                                                                                                                                                                                                                                                                                                                                                                                                                  ==================================================================

                                                                                                                                                                                                                                                                                                                                                                                                                  SFA (single auth)
                                                                                                                                                                                                                                                                                                                                                                                                                  MFA (>2 auth factors)
                                                                                                                                                                                                                                                                                                                                                                                                                  2FA (MFA == 2 factors)
                                                                                                                                                                                                                                                                                                                                                                                                                  Passwordless (no use of knowledge factors)
                                                                                                                                                                                                                                                                                                                                                                                                                  Adaptive auth (IA/ML for adaptive)

                                                                                                                                                                                                                                                                                                                                                                                                                  Auth ex: fingerprint + pin, showing ID to account, web browser verifies site legimit trough certificate, API secret api keys

                                                                                                                                                                                                                                                                                                                                                                                                                  ==== Authz: what you can access ? uses policy, claims or roles
                                                                                                                                                                                                                                                                                                                                                                                                                  permission policies that detail access/action

                                                                                                                                                                                                                                                                                                                                                                                                                  db can user Create, Update, Delete ...

                                                                                                                                                                                                                                                                                                                                                                                                                  OAuth2.0 access tokens
                                                                                                                                                                                                                                                                                                                                                                                                                  social media > emails

                                                                                                                                                                                                                                                                                                                                                                                                                  1. RBAC (permission based on roles)
                                                                                                                                                                                                                                                                                                                                                                                                                  2. ABAC (attributes)
                                                                                                                                                                                                                                                                                                                                                                                                                  3. MAC (mandatory)
                                                                                                                                                                                                                                                                                                                                                                                                                  4. DAC (owner resource)

                                                                                                                                                                                                                                                                                                                                                                                                                  ex: user logs into email can only see their emails, healthcare patients data can only be viewd by providers

                                                                                                                                                                                                                                                                                                                                                                                                                  ====== AUTHN + AUTHZ
                                                                                                                                                                                                                                                                                                                                                                                                                  complementary, authn defend accoutns, authz defend systems

                                                                                                                                                                                                                                                                                                                                                                                                                  Who are you ?
                                                                                                                                                                                                                                                                                                                                                                                                                  What are you allowed to do in this system ?

                                                                                                                                                                                                                                                                                                                                                                                                                  Combat advanced cyberattacks

                                                                                                                                                                                                                                                                                                                                                                                                                  source:
                                                                                                                                                                                                                                                                                                                                                                                                                  https://www.ibm.com/think/topics/authentication-vs-authorization?st_source=ai_mode#:~:text=Como%20a%20autentica%C3%A7%C3%A3o%20e%20a%20autoriza%C3%A7%C3%A3o%20trabalham,os%20sistemas%20que%20essas%20contas%20podem%20acessar.

                                                                                                                                                                                                                                                                                                                                                                                                                  OAUTH 2.0 Flow
                                                                                                                                                                                                                                                                                                                                                                                                                  Resource Owner, Client, Authorization Server, Resource Server, Redirect URI(callback), Response Type, Scope (granular permissions), Consent, Client Id/Secret, Authorization Code, Access Token, App Id

                                                                                                                                                                                                                                                                                                                                                                                                                  ======= ASSERTIONS ===========
                                                                                                                                                                                                                                                                                                                                                                                                                  Testes que realmente provam o comportamento (mínimo útil)

                                                                                                                                                                                                                                                                                                                                                                                                                  Login
                                                                                                                                                                                                                                                                                                                                                                                                                  Sem Basic → 401
                                                                                                                                                                                                                                                                                                                                                                                                                  Senha errada → 401
                                                                                                                                                                                                                                                                                                                                                                                                                  Certo → 200 com apiKey não vazia

                                                                                                                                                                                                                                                                                                                                                                                                                  Protegido
                                                                                                                                                                                                                                                                                                                                                                                                                  Sem X-API-Key → 401
                                                                                                                                                                                                                                                                                                                                                                                                                  Key inválida → 401
                                                                                                                                                                                                                                                                                                                                                                                                                  Key revogada → 401
                                                                                                                                                                                                                                                                                                                                                                                                                  Key válida → 200 e req.auth.userId correto

                                                                                                                                                                                                                                                                                                                                                                                                                  Persistência
                                                                                                                                                                                                                                                                                                                                                                                                                  users.email unique
                                                                                                                                                                                                                                                                                                                                                                                                                  API key armazenada como hash, nunca raw
                                                                                                                                                                                                                                                                                                                                                                                                                  last_used_at atualiza


                                                                                                                                                                                                                                                                                                                                                                                                                  RBAC (ROLE BASED ACCESS CONTROL) / ABAC (ATTRIBUTE BASED ACCES CONTROL)

                                                                                                                                                                                                                                                                                                                                                                                                                  SCIM its the service that automatically creates and manages centralized users, on a IpS we can have a SAML for authentication with legacy tools, OIDC for modern and SCIM for provisioning accounts and permissions 

                                                                                                                                                                                                                                                                                                                                                                                                                  ^^^ERVERTHING ITS JUST A PART OF THE IAM DISCIPLINE^^^
LINKS: https://www.ibm.com/think/topics/authentication-vs-authorization?st_source=ai_mode#:~:text=Como%20a%20autentica%C3%A7%C3%A3o%20e%20a%20autoriza%C3%A7%C3%A3o%20trabalham,os%20sistemas%20que%20essas%20contas%20podem%20acessar.
https://auth0.com/docs/get-started/identity-fundamentals/authentication-and-authorization?st_source=ai_mode
https://auth0.com/pt/intro-to-iam/saml-vs-openid-connect-oidc
https://www.strongdm.com/blog/oidc-vs-saml
https://datatracker.ietf.org/doc/html/rfc6749
https://auth0.com/pt/intro-to-iam
https://auth0.com/blog/how-saml-authentication-works/#Benefits-of-SAML-Authentication
https://www.youtube.com/watch?v=ApStxeFJfJk

https://www.youtube.com/watch?v=t18YB3xDfXI
https://www.youtube.com/watch?v=xJA8tP74KD0
https://www.youtube.com/watch?v=5KChrGWFcpk