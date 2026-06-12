# Onboarding Audit

The previous 13-slide "SCAVerse tour" (driven by `lib/scovers-onboarding-content.js`'s
`SCOVERS_ONBOARDING_SLIDES` and rendered via `OnboardingSlide`/`ScoversOnboardingVisual`)
has been replaced by the audience-branching consumer/franchisee flow in
`components/onboarding/OnboardingFlow.jsx`, rendered from
`HomepageOnboardingOverlay`.

The legacy cinematic video/music intro overlay (and its "Replay Intro" button)
have been removed. `HomepageOnboardingOverlay` is now a plain modal that wraps
`OnboardingFlow` directly. The first-visit storage key
(`SCOVERS_INTRO_STORAGE_KEY`) is used by `PlatformHome` to open it
automatically on a visitor's first home visit.
