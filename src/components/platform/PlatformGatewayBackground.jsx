const CURRENT_HOMEPAGE_VIDEO_URL = "https://res.cloudinary.com/dwc4hamrl/video/upload/q_auto/f_auto/v1780217188/grok_video_2026-05-31-16-45-59_qtjuki.mp4";

export default function PlatformGatewayBackground({ videoUrl, overlayOpacity = 0.68 }) {
  const src = videoUrl || CURRENT_HOMEPAGE_VIDEO_URL;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        className="h-full w-full object-cover"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        controls={false}
      />
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(3, 6, 12, ${overlayOpacity})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsla(43,100%,56%,0.03)_0%,_transparent_70%),radial-gradient(circle_at_top,rgba(255,196,31,0.16),transparent_38%),linear-gradient(to_bottom,rgba(10,10,14,0.18),rgba(10,10,14,0.76))]" />
    </div>
  );
}