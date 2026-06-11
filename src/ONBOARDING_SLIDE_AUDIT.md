# Onboarding Audit

The previous 13-slide "SCAVerse tour" (driven by `lib/scovers-onboarding-content.js`'s
`SCOVERS_ONBOARDING_SLIDES` and rendered via `OnboardingSlide`/`ScoversOnboardingVisual`)
has been replaced by the audience-branching consumer/franchisee flow in
`components/onboarding/OnboardingFlow.jsx`, rendered from
`HomepageOnboardingOverlay`.

The intro video (`SCOVERS_ONBOARDING_VIDEO_URL`) and first-visit storage key
(`SCOVERS_INTRO_STORAGE_KEY`) are still used by `HomepageOnboardingOverlay` and `PlatformHome`.
