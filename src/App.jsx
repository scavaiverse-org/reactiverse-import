import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AutoTextReveal from './components/animation/AutoTextReveal';
import AnimatedPageShell from './components/animation/AnimatedPageShell';
import AppLayout from './components/layout/AppLayout';
import TenantAdminLayout from './components/tenant-admin/TenantAdminLayout.jsx';
import MasterAdminLayout from './components/layout/MasterAdminLayout';
import ExperienceControls from './components/accessibility/ExperienceControls';
import ModuleGate from './components/ModuleGate';

// Eager pages: the platform gateway and auth flows users hit first.
import PlatformHome from './pages/PlatformHome';
import BecomeTenant from './pages/BecomeTenant';
import TenantLogin from './pages/TenantLogin';
import LoginRedirect from './components/auth/LoginRedirect';
import SignUp from './components/auth/SignUp';
import AuthCallback from './components/auth/AuthCallback';
import PlatformOverview from './pages/PlatformOverview';
import LegalUtility from './pages/LegalUtility';

// Everything else is split per route so the first paint doesn't ship the
// admin consoles, walkthrough engine, and editors in one bundle.
const Walkthrough = lazy(() => import('./pages/Walkthrough'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Vendors = lazy(() => import('./pages/Vendors'));
const VendorRegister = lazy(() => import('./pages/VendorRegister'));
const Commerce = lazy(() => import('./pages/Commerce'));
const AIGuide = lazy(() => import('./pages/AIGuide'));
const VirtualExperience = lazy(() => import('./pages/VirtualExperience'));
const Passport = lazy(() => import('./pages/Passport'));
const PresaleTickets = lazy(() => import('./pages/PresaleTickets'));
const TenantHome1 = lazy(() => import('./pages/tenant/TenantHome1'));
const TenantHome2 = lazy(() => import('./pages/tenant/TenantHome2'));
const TenantHome3 = lazy(() => import('./pages/tenant/TenantHome3'));
const TenantHome4 = lazy(() => import('./pages/tenant/TenantHome4'));
const TenantHome5 = lazy(() => import('./pages/tenant/TenantHome5'));
const Tickets1 = lazy(() => import('./pages/tenant/Tickets1'));
const Tickets2 = lazy(() => import('./pages/tenant/Tickets2'));
const Tickets3 = lazy(() => import('./pages/tenant/Tickets3'));
const Tickets4 = lazy(() => import('./pages/tenant/Tickets4'));
const Tickets5 = lazy(() => import('./pages/tenant/Tickets5'));
const About1 = lazy(() => import('./pages/tenant/About1'));
const About2 = lazy(() => import('./pages/tenant/About2'));
const About3 = lazy(() => import('./pages/tenant/About3'));
const About4 = lazy(() => import('./pages/tenant/About4'));
const About5 = lazy(() => import('./pages/tenant/About5'));
const Completion = lazy(() => import('./pages/tenant/Completion'));

// Admin pages (all lazy — heaviest part of the app)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminExhibits = lazy(() => import('./pages/admin/AdminExhibits'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const MasterDashboard = lazy(() => import('./pages/admin/MasterDashboard'));
const UsersAccess = lazy(() => import('./pages/admin/UsersAccess'));
const ExperienceLayer = lazy(() => import('./pages/admin/ExperienceLayer'));
const ModulesOverview = lazy(() => import('./pages/admin/ModulesOverview'));
const PlatformServices = lazy(() => import('./pages/admin/PlatformServices'));
const ContentData = lazy(() => import('./pages/admin/ContentData'));
const Infrastructure = lazy(() => import('./pages/admin/Infrastructure'));
const Tenants = lazy(() => import('./pages/admin/Tenants'));
const AdminWhiteLabel = lazy(() => import('./pages/admin/WhiteLabel'));
const TenantWalkthrough = lazy(() => import('./pages/admin/TenantWalkthrough'));
const ArchitectureBlueprint = lazy(() => import('./pages/admin/ArchitectureBlueprint'));
const ServicePage = lazy(() => import('./pages/admin/services/ServicePage'));
const ContentSubPage = lazy(() => import('./pages/admin/content/ContentSubPage'));
const ModuleOnboarding = lazy(() => import('./pages/admin/modules/ModuleOnboarding'));
const ModuleTicketing = lazy(() => import('./pages/admin/modules/ModuleTicketing'));
const ModuleAIGuide = lazy(() => import('./pages/admin/modules/ModuleAIGuide'));
const ModuleVendors = lazy(() => import('./pages/admin/modules/ModuleVendors'));
const ModuleCommerce = lazy(() => import('./pages/admin/modules/ModuleCommerce'));
const ModuleAnalytics = lazy(() => import('./pages/admin/modules/ModuleAnalytics'));
const ModuleGamification = lazy(() => import('./pages/admin/modules/ModuleGamification'));
const ModuleWalkthrough = lazy(() => import('./pages/admin/modules/ModuleWalkthrough'));
const TestersFeedback = lazy(() => import('./pages/admin/TestersFeedback'));
const PublicContent = lazy(() => import('./pages/admin/PublicContent'));
const PlatformPages = lazy(() => import('./pages/admin/PlatformPages'));
const Music = lazy(() => import('./pages/admin/Music'));
const OnboardingSong = lazy(() => import('./pages/admin/OnboardingSong'));
const QASentinel = lazy(() => import('./pages/admin/QASentinel'));
const UENProofs = lazy(() => import('./pages/admin/UENProofs'));
const TenantMusic = lazy(() => import('./pages/tenant-admin/TenantMusic.jsx'));
const TenantHomeEditor = lazy(() => import('./pages/tenant-admin/TenantHomeEditor.jsx'));

import AccountTypeGate from './components/auth/AccountTypeGate';
import MuseumOpenGate from './components/tenant/MuseumOpenGate';
import { TenantAdminRedirect, TenantPublicRedirect } from './components/routing/CanonicalRedirects';
import { DEFAULT_MUSEUM_SLUG, museumPath } from '@/lib/domain-registry';
import { startSentinelRuntimeCapture } from '@/lib/qa-sentinel/browser-events';
import PublicImmersiveLayer from './components/public/PublicImmersiveLayer';
import InternalRapidPortalGateway from './components/internal/InternalRapidPortalGateway';
import MasterHamburgerNav from './components/navigation/MasterHamburgerNav';

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  );
}

// Shorthand: a module-gated route element.
const gated = (moduleKey, element) => <ModuleGate moduleKey={moduleKey}>{element}</ModuleGate>;

const AuthenticatedApp = () => {
  const { authError, navigateToLogin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError?.type]);

  useEffect(() => {
    return startSentinelRuntimeCapture();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = `${location.pathname}${location.search || ''}`;
    const last = window.sessionStorage.getItem('scaverse_current_path');
    if (last && last !== current) window.sessionStorage.setItem('scaverse_previous_path', last);
    window.sessionStorage.setItem('scaverse_current_path', current);
  }, [location.pathname, location.search]);

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return null;
    }
  }

  return (
    <AnimatedPageShell key={location.pathname}>
      <PublicImmersiveLayer>
        <AccountTypeGate />
        <InternalRapidPortalGateway />
        <MasterHamburgerNav />
        <div className="min-h-screen pt-16 sm:pt-20">
      <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
      <Route path="/" element={<PlatformHome />} />
      <Route path="/presale" element={<PresaleTickets />} />
      <Route path="/become-a-tenant" element={<BecomeTenant />} />
      <Route path="/virtual-experience" element={<VirtualExperience />} />
      <Route path="/passport" element={<Passport />} />
      <Route path="/tenant-login" element={<TenantLogin />} />
      <Route element={<AppLayout />}>
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/about" element={<Navigate to="/platform/overview" replace />} />
      <Route path="/pricing" element={<Navigate to="/become-a-tenant" replace />} />
      <Route path="/services" element={<Navigate to="/platform/services" replace />} />
      <Route path="/marketplace" element={<Navigate to="/virtual-experience" replace />} />
      <Route path="/docs" element={<Navigate to="/platform/docs" replace />} />
      <Route path="/showcase" element={<Navigate to="/virtual-experience" replace />} />

      {/* Canonical admin standard route aliases */}
      <Route path="/admin/platform" element={<Navigate to="/platform/admin" replace />} />
      <Route path="/admin/platform/pages" element={<Navigate to="/platform/admin/pages" replace />} />
      <Route path="/admin/music" element={<MasterAdminLayout />}>
        <Route index element={<Music />} />
      </Route>
      <Route path="/admin/platform/media" element={<Navigate to="/platform/admin/public-content" replace />} />
      <Route path="/admin/platform/analytics" element={<Navigate to="/platform/admin/modules/analytics" replace />} />
      <Route path="/admin/platform/navigation" element={<Navigate to="/platform/admin/pages" replace />} />
      <Route path="/admin/platform/templates" element={<Navigate to="/platform/admin/public-content" replace />} />
      <Route path="/admin/platform/seo" element={<Navigate to="/platform/admin/pages" replace />} />
      <Route path="/admin/platform/landing-pages" element={<Navigate to="/platform/admin/pages" replace />} />
      <Route path="/admin/platform/featured-museums" element={<Navigate to="/platform/admin/tenants" replace />} />
      <Route path="/admin/platform/settings" element={<Navigate to="/platform/admin/infrastructure" replace />} />
      <Route path="/admin/master" element={<Navigate to="/platform/admin" replace />} />
      <Route path="/admin/master/tenants" element={<Navigate to="/platform/admin/tenants" replace />} />
      <Route path="/admin/master/users" element={<Navigate to="/platform/admin/users-access" replace />} />
      <Route path="/admin/master/system" element={<Navigate to="/platform/admin/infrastructure" replace />} />
      <Route path="/admin/master/permissions" element={<Navigate to="/platform/admin/users-access" replace />} />
      <Route path="/admin/master/billing" element={<Navigate to="/platform/admin/tenants" replace />} />
      <Route path="/admin/master/analytics" element={<Navigate to="/platform/admin/modules/analytics" replace />} />
      <Route path="/admin/master/infrastructure" element={<Navigate to="/platform/admin/infrastructure" replace />} />
      <Route path="/admin/master/modules" element={<Navigate to="/platform/admin/modules" replace />} />
      <Route path="/admin/master/moderation" element={<Navigate to="/platform/admin/testers-feedback" replace />} />
      <Route path="/admin/master/media" element={<Navigate to="/platform/admin/public-content" replace />} />
      <Route path="/admin/master/ai" element={<Navigate to="/platform/admin/modules/ai-guide" replace />} />
      <Route path="/admin/master/feature-flags" element={<Navigate to="/platform/admin/modules" replace />} />
      <Route path="/admin/master/templates" element={<Navigate to="/platform/admin/public-content" replace />} />
      <Route path="/admin/master/logs" element={<Navigate to="/platform/admin/testers-feedback" replace />} />
      <Route path="/admin/tenant" element={<Navigate to={`/museum/${DEFAULT_MUSEUM_SLUG}/admin`} replace />} />
      <Route path="/admin/tenant/:tenantId" element={<TenantAdminRedirect />} />
      <Route path="/admin/tenant/:tenantId/home" element={<TenantAdminRedirect section="home" />} />
      <Route path="/admin/tenant/:tenantId/tickets" element={<TenantAdminRedirect section="tickets" />} />
      <Route path="/admin/tenant/:tenantId/vendors" element={<TenantAdminRedirect section="vendors" />} />
      <Route path="/admin/tenant/:tenantId/exhibits" element={<TenantAdminRedirect section="exhibits" />} />
      <Route path="/admin/tenant/:tenantId/analytics" element={<TenantAdminRedirect section="analytics" />} />
      <Route path="/admin/tenant/walkthrough" element={<Navigate to={`/museum/${DEFAULT_MUSEUM_SLUG}/admin/walkthrough`} replace />} />
      <Route path="/admin/tenant/:tenantId/walkthrough" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/tour" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/begin-tour" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/scene-builder" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/tour-builder" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/experience-builder" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/walkthrough-builder" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/onboarding" element={<TenantAdminRedirect section="home" />} />
      <Route path="/admin/tenant/:tenantId/setup" element={<TenantAdminRedirect />} />
      <Route path="/admin/tenant/:tenantId/entrance" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/stages" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/experience" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/rooms" element={<TenantAdminRedirect section="walkthrough" />} />
      <Route path="/admin/tenant/:tenantId/ai-guide" element={<TenantAdminRedirect />} />
      <Route path="/admin/tenant/:tenantId/commerce" element={<TenantAdminRedirect section="vendors" />} />
      <Route path="/admin/tenant/:tenantId/gamification" element={<TenantAdminRedirect />} />
      <Route path="/admin/tenant/:tenantId/vr" element={<TenantAdminRedirect />} />
      <Route path="/admin/tenant/:tenantId/media" element={<TenantAdminRedirect section="home" />} />
      <Route path="/admin/tenant/:tenantId/staff" element={<TenantAdminRedirect />} />
      <Route path="/admin/tenant/:tenantId/settings" element={<TenantAdminRedirect />} />

      {/* Museum-owned public routes */}
      <Route path="/museum/:tenantSlug" element={<TenantPublicRedirect page="home" />} />
      <Route path="/museum/:tenantSlug/exhibits" element={<TenantPublicRedirect page="home" />} />
      <Route path="/museum/:tenantSlug/experience" element={<TenantPublicRedirect page="begin-tour" />} />
      <Route path="/museum/:tenantSlug/ai-guide" element={<TenantPublicRedirect page="home" />} />
      <Route path="/museum/:tenantSlug/entrance" element={<TenantPublicRedirect page="begin-tour" />} />
      <Route path="/museum/:tenantSlug/rooms" element={<TenantPublicRedirect page="begin-tour" />} />
      <Route path="/museum/:tenantSlug/stages" element={<TenantPublicRedirect page="begin-tour" />} />
      <Route path="/museum/:tenantSlug/completion" element={<Completion />} />
      <Route path="/museum/:tenantSlug/home" element={<TenantHome1 />} />
      <Route path="/museum/:tenantSlug/home-2" element={<TenantHome2 />} />
      <Route path="/museum/:tenantSlug/home-3" element={<TenantHome3 />} />
      <Route path="/museum/:tenantSlug/home-4" element={<TenantHome4 />} />
      <Route path="/museum/:tenantSlug/home-5" element={<TenantHome5 />} />
      <Route element={<AppLayout />}>
        <Route path="/museum/:tenantSlug/tickets" element={gated("ticketing", <Tickets1 />)} />
        <Route path="/museum/:tenantSlug/tickets-2" element={gated("ticketing", <Tickets2 />)} />
        <Route path="/museum/:tenantSlug/tickets-3" element={gated("ticketing", <Tickets3 />)} />
        <Route path="/museum/:tenantSlug/tickets-4" element={gated("ticketing", <Tickets4 />)} />
        <Route path="/museum/:tenantSlug/tickets-5" element={gated("ticketing", <Tickets5 />)} />
      </Route>
      <Route path="/museum/:tenantSlug/about" element={<About1 />} />
      <Route path="/museum/:tenantSlug/about-2" element={<About2 />} />
      <Route path="/museum/:tenantSlug/about-3" element={<About3 />} />
      <Route path="/museum/:tenantSlug/about-4" element={<About4 />} />
      <Route path="/museum/:tenantSlug/about-5" element={<About5 />} />
      <Route path="/museum/:tenantSlug/tour/:walkthroughIndex" element={gated("walkthrough", <Walkthrough />)} />
      <Route path="/museum/:tenantSlug/begin-tour" element={gated("walkthrough", <Walkthrough />)} />
      <Route path="/museum/:tenantSlug/begin-tour/:walkthroughKey" element={gated("walkthrough", <Walkthrough />)} />
      <Route path="/museum/:tenantSlug/begin-tour-2" element={<TenantPublicRedirect page="tour/2" />} />
      <Route path="/museum/:tenantSlug/begin-tour-3" element={<TenantPublicRedirect page="tour/3" />} />
      <Route path="/museum/:tenantSlug/begin-tour-4" element={<TenantPublicRedirect page="tour/4" />} />
      <Route path="/museum/:tenantSlug/begin-tour-5" element={<TenantPublicRedirect page="tour/5" />} />
      <Route element={<AppLayout />}>
        <Route path="/museum/:tenantSlug/museum" element={<TenantPublicRedirect page="home" />} />
        <Route path="/museum/:tenantSlug/onboarding" element={<TenantPublicRedirect page="home" />} />
        <Route path="/museum/:tenantSlug/vendors" element={<MuseumOpenGate>{gated("vendors", <Vendors />)}</MuseumOpenGate>} />
        <Route path="/museum/:tenantSlug/vendors/register" element={<MuseumOpenGate>{gated("vendors", <VendorRegister />)}</MuseumOpenGate>} />
        <Route path="/museum/:tenantSlug/commerce" element={<MuseumOpenGate>{gated("commerce", <Commerce />)}</MuseumOpenGate>} />
        <Route path="/museum/:tenantSlug/walkthrough" element={<MuseumOpenGate>{gated("walkthrough", <Walkthrough />)}</MuseumOpenGate>} />
        <Route path="/museum/:tenantSlug/walkthrough/:walkthroughKey" element={<MuseumOpenGate>{gated("walkthrough", <Walkthrough />)}</MuseumOpenGate>} />
        <Route path="/museum/:tenantSlug/guide" element={<MuseumOpenGate>{gated("ai_guide", <AIGuide />)}</MuseumOpenGate>} />
      </Route>
      <Route path="/museum/:tenantSlug/room-preview" element={<TenantPublicRedirect page="begin-tour" />} />

      {/* Platform-owned public routes */}
      <Route element={<AppLayout />}>
        <Route path="/platform" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/platform/overview" element={<PlatformOverview />} />
        <Route path="/platform/analytics" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/platform/white-label" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/platform/docs" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/platform/system" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/platform/infrastructure" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/platform/services" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/consulting" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/ai-consulting" element={<Navigate to="/platform/overview" replace />} />
        <Route path="/privacy" element={<LegalUtility />} />
        <Route path="/terms" element={<LegalUtility />} />
        <Route path="/refund-policy" element={<LegalUtility />} />
        <Route path="/contact" element={<LegalUtility />} />
        <Route path="/accessibility" element={<LegalUtility />} />
      </Route>

      {/* Museum admin domain */}
      <Route path="/museum/:tenantSlug/admin" element={<TenantAdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="walkthrough" element={gated("walkthrough", <TenantWalkthrough />)} />
        <Route path="experience" element={<Navigate to="walkthrough" replace />} />
        <Route path="experience-builder" element={<Navigate to="walkthrough" replace />} />
        <Route path="scene-builder" element={<Navigate to="walkthrough" replace />} />
        <Route path="tour-builder" element={<Navigate to="walkthrough" replace />} />
        <Route path="walkthrough-builder" element={<Navigate to="walkthrough" replace />} />
        <Route path="tour" element={<Navigate to="walkthrough" replace />} />
        <Route path="begin-tour" element={<Navigate to="walkthrough" replace />} />
        <Route path="rooms" element={<Navigate to="walkthrough" replace />} />
        <Route path="stages" element={<Navigate to="walkthrough" replace />} />
        <Route path="tickets" element={gated("ticketing", <AdminTickets />)} />
        <Route path="vendors" element={gated("vendors", <AdminVendors />)} />
        <Route path="exhibits" element={<AdminExhibits />} />
        <Route path="analytics" element={gated("analytics", <AdminAnalytics />)} />
        <Route path="music" element={<TenantMusic />} />
        <Route path="home" element={<TenantHomeEditor />} />
      </Route>

      {/* Platform admin domain */}
      <Route path="/platform/admin" element={<MasterAdminLayout />}>
        <Route index element={<MasterDashboard />} />
        <Route path="users-access" element={<UsersAccess />} />
        <Route path="experience-layer" element={<ExperienceLayer />} />
        <Route path="modules" element={<ModulesOverview />} />
        <Route path="modules/onboarding" element={<ModuleOnboarding />} />
        <Route path="modules/ticketing" element={<ModuleTicketing />} />
        <Route path="modules/ai-guide" element={<ModuleAIGuide />} />
        <Route path="modules/walkthrough" element={<ModuleWalkthrough />} />
        <Route path="modules/vendors" element={<ModuleVendors />} />
        <Route path="modules/commerce" element={<ModuleCommerce />} />
        <Route path="modules/analytics" element={<ModuleAnalytics />} />
        <Route path="modules/gamification" element={<ModuleGamification />} />
        <Route path="platform-services" element={<PlatformServices />} />
        <Route path="services/experience-config" element={<Navigate to={`/museum/${DEFAULT_MUSEUM_SLUG}/admin/walkthrough`} replace />} />
        <Route path="services/:serviceKey" element={<ServicePage />} />
        <Route path="content-data" element={<ContentData />} />
        <Route path="content/:contentKey" element={<ContentSubPage />} />
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="qa-sentinel" element={<QASentinel />} />
        <Route path="uen" element={<UENProofs />} />
        <Route path="testers-feedback" element={<TestersFeedback />} />
        <Route path="public-content" element={<PublicContent />} />
        <Route path="media" element={<Navigate to="public-content" replace />} />
        <Route path="home" element={<PlatformPages initialPageKey="platform_home" />} />
        <Route path="music" element={<Music />} />
        <Route path="onboardingsong" element={<OnboardingSong />} />
        <Route path="pages" element={<PlatformPages />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="white-label" element={<AdminWhiteLabel />} />
        <Route path="architecture-blueprint" element={<ArchitectureBlueprint />} />
      </Route>

      {/* Legacy redirects only; no legacy mixed rendering */}
      <Route path="/home" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/museum" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/walkthrough" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "begin-tour")} replace />} />
      <Route path="/guide" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/ai-guide" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/tickets" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "tickets")} replace />} />
      <Route path="/vendors" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/vendors/register" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/vendor-register" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/commerce" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "home")} replace />} />
      <Route path="/room-preview" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "begin-tour")} replace />} />
      <Route path="/test-room" element={<Navigate to={museumPath(DEFAULT_MUSEUM_SLUG, "begin-tour")} replace />} />
      <Route path="/analytics" element={<Navigate to="/platform/overview" replace />} />
      <Route path="/white-label" element={<Navigate to="/platform/overview" replace />} />
      <Route path="/expansion" element={<Navigate to="/platform/overview" replace />} />
      <Route path="/documentation-notes" element={<Navigate to="/platform/overview" replace />} />
      <Route path="/admin" element={<Navigate to="/platform/admin" replace />} />
      <Route path="/admin/*" element={<Navigate to="/platform/admin" replace />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
        </div>
      </PublicImmersiveLayer>
    </AnimatedPageShell>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AutoTextReveal />
          <AuthenticatedApp />
          <ExperienceControls />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
