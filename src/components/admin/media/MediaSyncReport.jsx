export default function MediaSyncReport({ draft }) {
  const assigned = [
    draft.heroDesktopMediaId,
    draft.heroTabletMediaId,
    draft.heroMobileMediaId,
    draft.highlightMediaId,
    draft.visitCardMediaId,
    draft.ariaCardMediaId,
    draft.storiesCardMediaId,
    draft.futureCardMediaId,
    draft.finalCtaMediaId,
    draft.museumHighlightsSection?.backgroundMediaId,
    ...(draft.museumHighlightCards || []).map((card) => card.backgroundMediaId),
    draft.whatYouCanDoSection?.backgroundMediaId,
    ...(draft.homeCards || []).map((card) => card.backgroundMediaId),
    draft.schoolsPartnersSection?.backgroundMediaId,
    draft.platformPreviewSection?.backgroundMediaId,
    draft.finalCtaSection?.backgroundMediaId,
  ].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
      <p className="text-sm font-semibold text-emerald-300">Media Sync Report</p>
      <div className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
        Admin Change → Save Preset → Registry Updated → HomeConfig Media ID Updated → Publish → Public Home Reads Registry → Mobile/Tablet/Desktop Render.
        {`\nAssigned media references: ${assigned}. Publish normalizes saved media URLs into registry IDs before the public Home page renders.`}
      </div>
    </div>
  );
}