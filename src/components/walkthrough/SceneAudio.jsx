import { useEffect, useRef } from "react";

export default function SceneAudio({ scene, muted }) {
  const audioRef = useRef(null);
  const audioUrl = scene?.audio_url || scene?.audioUrl || scene?.ambience_audio_url || scene?.ambienceAudioUrl || "";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
      if (!muted && audioUrl) audioRef.current.play().catch(() => {});
      if (muted) audioRef.current.pause();
    }
  }, [muted, audioUrl, scene?.id]);

  if (!audioUrl) return null;

  return <audio ref={audioRef} src={audioUrl} loop preload="metadata" className="hidden" />;
}