import { useEffect, useRef } from "react";

export default function SceneAudio({ scene, muted }) {
  const ambienceRef = useRef(null);
  const narrationRef = useRef(null);
  const ambienceUrl = scene?.audio_url || scene?.audioUrl || scene?.ambience_audio_url || scene?.ambienceAudioUrl || "";
  const narrationUrl = scene?.narration_audio_url || scene?.narrationAudioUrl || "";

  useEffect(() => {
    if (ambienceRef.current) {
      ambienceRef.current.muted = muted;
      if (!muted && ambienceUrl) ambienceRef.current.play().catch(() => {});
      if (muted) ambienceRef.current.pause();
    }
  }, [muted, ambienceUrl, scene?.id]);

  useEffect(() => {
    if (narrationRef.current) {
      narrationRef.current.muted = muted;
      if (!muted && narrationUrl) {
        narrationRef.current.currentTime = 0;
        narrationRef.current.play().catch(() => {});
      }
      if (muted) narrationRef.current.pause();
    }
  }, [muted, narrationUrl, scene?.id]);

  if (!ambienceUrl && !narrationUrl) return null;

  return (
    <>
      {ambienceUrl && <audio ref={ambienceRef} src={ambienceUrl} loop preload="metadata" className="hidden" />}
      {narrationUrl && <audio ref={narrationRef} src={narrationUrl} preload="metadata" className="hidden" />}
    </>
  );
}
