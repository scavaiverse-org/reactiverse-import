# Route Access Audit

Status: ACTIVE ROUTE PROOF DOCUMENT

Source of truth: `App.jsx` plus `lib/route-registry.js`

## Route Categories

- `public`
- `protected`
- `admin`
- `tenant_admin`
- `redirect`
- `deprecated`
- `fallback`

## Critical Public Routes

| Route | Component/Behavior | Category | Required Proof |
|---|---|---|---|
| `/` | PlatformHome | public | loads, CTAs route, mobile safe |
| `/become-a-tenant` | BecomeTenant | public | form/CTA works |
| `/virtual-experience` | VirtualExperience | public | loads demo path |
| `/tenant-login` | TenantLogin | public/auth entry | login route works |
| `/login` | LoginRedirect | auth redirect | redirects safely |
| `/platform/overview` | PlatformOverview | public | loads platform explanation |
| `/privacy` | LegalUtility | public | legal page loads |
| `/terms` | LegalUtility | public | legal page loads |
| `/refund-policy` | LegalUtility | public | legal page loads |
| `/contact` | LegalUtility | public | contact page loads |
| `/accessibility` | LegalUtility | public | accessibility page loads |

## Critical Tenant Public Routes

| Route | Component/Behavior | Category | Required Proof |
|---|---|---|---|
| `/museum/:tenantSlug/home` | TenantHome1 | public tenant | correct tenant content |
| `/museum/:tenantSlug/tickets` | Tickets1 | public tenant | ticket flow persists |
| `/museum/:tenantSlug/about` | About1 | public tenant | tenant content loads |
| `/museum/:tenantSlug/begin-tour` | Walkthrough | public tenant | walkthrough sequence works |
| `/museum/:tenantSlug/walkthrough` | Walkthrough | public tenant | alias works or documented |
| `/museum/:tenantSlug/guide` | AIGuide | public tenant | tenant-scoped AI context |
| `/museum/:tenantSlug/vendors` | Vendors | public tenant | vendor display/register path |
| `/museum/:tenantSlug/vendors/register` | VendorRegister | public tenant | submission persists |
| `/museum/:tenantSlug/commerce` | Commerce | public tenant | status clear if demo |
| `/museum/:tenantSlug/completion` | Completion | public tenant | confirmation works |

## Platform Admin Routes

| Route | Component | Category | Required Proof |
|---|---|---|---|
| `/platform/admin` | MasterDashboard | admin | platform/admin role only |
| `/platform/admin/users-access` | UsersAccess | admin | role management safe |
| `/platform/admin/experience-layer` | ExperienceLayer | admin | loads, no fake actions |
| `/platform/admin/modules` | ModulesOverview | admin | module status loads |
| `/platform/admin/modules/onboarding` | ModuleOnboarding | admin | loads/config persists |
| `/platform/admin/modules/ticketing` | ModuleTicketing | admin | loads/config persists |
| `/platform/admin/modules/ai-guide` | ModuleAIGuide | admin | AI trust fields checked |
| `/platform/admin/modules/walkthrough` | ModuleWalkthrough | admin | connects to walkthrough admin |
| `/platform/admin/modules/vendors` | ModuleVendors | admin | vendor config safe |
| `/platform/admin/modules/commerce` | ModuleCommerce | admin | payment/demo status clear |
| `/platform/admin/modules/analytics` | ModuleAnalytics | admin | analytics data protected |
| `/platform/admin/modules/gamification` | ModuleGamification | admin | demo/gaming status clear |
| `/platform/admin/platform-services` | PlatformServices | admin | service cards route correctly |
| `/platform/admin/content-data` | ContentData | admin | data tools protected |
| `/platform/admin/infrastructure` | Infrastructure | admin | secrets not exposed |
| `/platform/admin/qa-sentinel` | QASentinel | admin | QA export works |
| `/platform/admin/testers-feedback` | TestersFeedback | admin | feedback records protected |
| `/platform/admin/public-content` | PublicContent | admin | public content controls safe |
| `/platform/admin/home` | PlatformPages | admin | platform home mirror control |
| `/platform/admin/music` | Music | admin | media/music protected |
| `/platform/admin/pages` | PlatformPages | admin | page config protected |
| `/platform/admin/tenants` | Tenants | admin | tenant registry protected |
| `/platform/admin/white-label` | AdminWhiteLabel | admin | branding protected |
| `/platform/admin/architecture-blueprint` | ArchitectureBlueprint | admin | architecture map loads |

## Tenant Admin Routes

| Route | Component | Category | Required Proof |
|---|---|---|---|
| `/museum/:tenantSlug/admin` | AdminDashboard | tenant_admin | correct tenant only |
| `/museum/:tenantSlug/admin/home` | TenantHomeEditor | tenant_admin | public mirror updates |
| `/museum/:tenantSlug/admin/walkthrough` | TenantWalkthrough | tenant_admin | draft/preview/publish proof |
| `/museum/:tenantSlug/admin/tickets` | AdminTickets | tenant_admin | own tickets only |
| `/museum/:tenantSlug/admin/vendors` | AdminVendors | tenant_admin | own vendors only |
| `/museum/:tenantSlug/admin/exhibits` | AdminExhibits | tenant_admin | own exhibits only |
| `/museum/:tenantSlug/admin/analytics` | AdminAnalytics | tenant_admin | own analytics only |
| `/museum/:tenantSlug/admin/music` | TenantMusic | tenant_admin | own music only |

## Deprecated / Duplicate Tenant Public Variants

The following route families must be verified, then kept only if intentionally used for demos or redirected/documented:

- `/museum/:tenantSlug/home-2` through `home-5`
- `/museum/:tenantSlug/tickets-2` through `tickets-5`
- `/museum/:tenantSlug/about-2` through `about-5`
- `/museum/:tenantSlug/begin-tour-2` through `begin-tour-5`

Export recommendation: freeze them as deprecated demo variants unless client explicitly needs them.

## Required Manual Route Test For Every Route

- open route from navigation
- open route directly by URL
- refresh route
- test mobile width
- test bad tenant slug where applicable
- test unauthenticated access
- test normal user access
- test tenant admin A/B access
- test platform admin access
- confirm no redirect loop
- confirm no blank screen
- confirm no console crash