import ResolvedMedia, { getMediaKind } from "@/components/walkthrough/ResolvedMedia";
import ScrollableImageLayer from "@/components/walkthrough/ScrollableImageLayer";
import MuseumArtifactLayer from "@/components/walkthrough/MuseumArtifactLayer";
import ThreePanelScrollableImageLayer from "@/components/walkthrough/ThreePanelScrollableImageLayer";
import WalkthroughFallbackVisual from "@/components/walkthrough/WalkthroughFallbackVisual";
import { getPublicMediaSlots } from "@/lib/walkthrough-media-bindings";
import { normalizeScrollableImageFields } from "@/lib/scrollable-image";
import { getSafeMediaUrl } from "@/lib/walkthrough-media-url";

// Public renderer should ONLY use a generated panorama once it is approved & complete.
function getApprovedPanoramaUrl(source = {}) {
  const n = normalizeScrollableImageFields(source);
  if (n.scrollable_image_enabled && n.scrollable_image_approved && n.scrollable_image_generation_status === "complete" && n.scrollable_image_extended_url && n.scrollable_image_extended_url !== n.scrollable_image_original_url) {
    return n.scrollable_image_extended_url;
  }
  return "";
}

function canRenderThreePanelDebug(source = {}) {
  const n = normalizeScrollableImageFields(source);
  const debugEnabled = typeof window !== "undefined" && window.localStorage?.getItem("scaverse_scrollable_debug") === "true";
  return debugEnabled && n.scrollable_image_enabled && n.scrollable_image_generation_status === "complete" && getSafeMediaUrl(n.scrollable_image_left_extension_url) && getSafeMediaUrl(n.scrollable_image_right_extension_url);
}

export default function WalkthroughMediaLayer({ room }) {
  const { background: backgroundMedia, foreground: foregroundMedia } = getPublicMediaSlots(room || {});
  const backgroundUrl = getSafeMediaUrl(backgroundMedia?.url);
  const foregroundUrl = getSafeMediaUrl(foregroundMedia?.url);
  const backgroundKind = getMediaKind(backgroundUrl, backgroundMedia?.type);
  const hasVisualBackground = backgroundUrl && backgroundKind !== "audio";
  const alt = room?.accessibility?.alt_text || room?.title || "Walkthrough media";

  // Public rendering prefers the APPROVED generated panorama; otherwise falls back to the original upload.
  const backgroundScrollableUrl = backgroundMedia?.scrollable ? getSafeMediaUrl(getApprovedPanoramaUrl(backgroundMedia.scrollable) || backgroundUrl) : backgroundUrl;
  const foregroundScrollableUrl = foregroundMedia?.scrollable ? getSafeMediaUrl(getApprovedPanoramaUrl(foregroundMedia.scrollable) || foregroundUrl) : foregroundUrl;

  return (
    <>
      {hasVisualBackground ? (
        backgroundKind === "image" && backgroundMedia.scrollable && getApprovedPanoramaUrl(backgroundMedia.scrollable) ? (
          <ScrollableImageLayer url={backgroundScrollableUrl} alt={alt} settings={backgroundMedia.scrollable}>
            <MuseumArtifactLayer room={room} />
          </ScrollableImageLayer>
        ) : backgroundKind === "image" && backgroundMedia.scrollable && canRenderThreePanelDebug(backgroundMedia.scrollable) ? (
          <ThreePanelScrollableImageLayer originalUrl={getSafeMediaUrl(backgroundMedia.scrollable.scrollable_image_original_url) || backgroundUrl} leftExtensionUrl={getSafeMediaUrl(backgroundMedia.scrollable.scrollable_image_left_extension_url)} rightExtensionUrl={getSafeMediaUrl(backgroundMedia.scrollable.scrollable_image_right_extension_url)} alt={alt} settings={backgroundMedia.scrollable}>
            <MuseumArtifactLayer room={room} />
          </ThreePanelScrollableImageLayer>
        ) : backgroundKind === "image" && backgroundMedia.scrollable ? (
          <ScrollableImageLayer url={backgroundScrollableUrl} alt={alt} settings={backgroundMedia.scrollable}>
            <MuseumArtifactLayer room={room} />
          </ScrollableImageLayer>
        ) : (
          <>
            <ResolvedMedia url={backgroundUrl} mediaType={backgroundMedia.type} alt={alt} className="h-full w-full object-cover" fallbackVisual />
            <MuseumArtifactLayer room={room} />
          </>
        )
      ) : (
        <WalkthroughFallbackVisual />
      )}
      {foregroundUrl && (
        <div className={`${foregroundMedia.scrollable ? "pointer-events-auto" : "pointer-events-none"} absolute inset-0 flex items-center justify-center p-8`}>
          {getMediaKind(foregroundUrl, foregroundMedia.type) === "image" && foregroundMedia.scrollable ? (
            <ScrollableImageLayer url={foregroundScrollableUrl} alt={alt} settings={foregroundMedia.scrollable} className="h-[72vh] w-[86vw] rounded-2xl" />
          ) : (
            <ResolvedMedia url={foregroundUrl} mediaType={foregroundMedia.type} alt={alt} className="h-[72vh] w-[86vw] rounded-2xl object-contain opacity-90 drop-shadow-2xl" fallbackVisual />
          )}
        </div>
      )}
    </>
  );
}