# Onboarding Slide Audit

The SCAVerse first-visit onboarding is a single overlay (`HomepageOnboardingOverlay`)
driving 14 slides defined in `lib/scovers-onboarding-content.js`. Navigation is centralized
in `handleNext` / `handleSkip` — there is no per-slide `navigate()`.

- Primary CTA (`__NEXT__`) → `setCurrent(current + 1)` only.
- `Skip Intro` → `handleSkip` → `/platform/overview` (the ONLY early exit).
- Final slide CTA replays the intro (resets to slide 0).

---

## Slide 1: Enter SCAVerse
CTA label: Begin the Experience
CTA action: __NEXT__ → slide 2
Expected result: Advance to slide 2
Actual result after fix: Advances to slide 2
Exit onboarding? No

## Slide 2: One platform. Many worlds.
CTA label: Show Me the Platform
CTA action: __NEXT__ → slide 3
Expected result: Advance to slide 3
Actual result after fix: Advances to slide 3
Exit onboarding? No

## Slide 3: Built for people, not dashboards.
CTA label: See the Visitor Path
CTA action: __NEXT__ → slide 4
Expected result: Advance to slide 4
Actual result after fix: Advances to slide 4
Exit onboarding? No

## Slide 4: Choose a live museum to begin.
CTA label: Continue the Tour
CTA action: __NEXT__ → slide 5
Expected result: Advance to slide 5
Actual result after fix: Advances to slide 5
Exit onboarding? No

## Slide 5: Every museum has a front door.
CTA label: Explore Homepages
CTA action: __NEXT__ → slide 6
Expected result: Advance to slide 6
Actual result after fix: Advances to slide 6
Exit onboarding? No

## Slide 6: Walk through stories, not pages.
CTA label: Continue Walkthrough
CTA action: __NEXT__ → slide 7
Expected result: Advance to slide 7
Actual result after fix: Advances to slide 7
Exit onboarding? No

## Slide 7: Every visitor can ask for help.
CTA label: Continue Guide
CTA action: __NEXT__ → slide 8
Expected result: Advance to slide 8
Actual result after fix: Advances to slide 8
Exit onboarding? No

## Slide 8: Experiences can lead to action.
CTA label: Continue Action Paths
CTA action: __NEXT__ → slide 9
Expected result: Advance to slide 9
Actual result after fix: Advances to slide 9
Exit onboarding? No

## Slide 9: Build the journey behind the scenes.
CTA label: Continue Tools
CTA action: __NEXT__ → slide 10
Expected result: Advance to slide 10
Actual result after fix: Advances to slide 10
Exit onboarding? No

## Slide 10: Turn media into museum objects.
CTA label: Continue Media
CTA action: __NEXT__ → slide 11
Expected result: Advance to slide 11
Actual result after fix: Advances to slide 11
Exit onboarding? No

## Slide 11: The system stays organized.
CTA label: Continue System Layer
CTA action: __NEXT__ → slide 12
Expected result: Advance to slide 12
Actual result after fix: Advances to slide 12
Exit onboarding? No

## Slide 12: Readiness is checked, not assumed.
CTA label: Continue Readiness
CTA action: __NEXT__ → slide 13
Expected result: Advance to slide 13
Actual result after fix: Advances to slide 13
Exit onboarding? No

## Slide 13: Every journey can teach the operator.
CTA label: Continue Growth
CTA action: __NEXT__ → slide 14
Expected result: Advance to slide 14
Actual result after fix: Advances to slide 14
Exit onboarding? No

## Slide 14: Your digital destination starts here.
CTA label: Replay Intro
CTA action: __NEXT__ → resets to slide 1 (replay)
Expected result: Replay the intro from slide 1
Actual result after fix: Resets to slide 1
Exit onboarding? No (final-slide replay per product logic)

---

## Final Result

- All slide CTAs route to the next slide.
- Skip Intro is the only early exit route (→ /platform/overview).
- Existing animations are preserved (background video, sheen, slide transitions, audio).
- Cinematic layers were added on top: CinematicTextureLayer, GoldDustField,
  OperaLightSweep, OnboardingProgressRail, CinematicCTA, ImmersiveSlideShell, SlideAuditOverlay.
- Copy was reduced by ~20% across every slide (sharper subtitle + body).
- First-visit popup triggers via `useFirstVisit` on PlatformHome; "Replay Intro" reopens it.
- Onboarding now feels more immersive, premium, and emotionally guided.