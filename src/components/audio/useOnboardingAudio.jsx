import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

let onboardingAudio = null;
let fadeFrame = null;
let userAudioSeeded = false;

function getAudio() {
  if (typeof Audio === "undefined") return null;
  if (!onboardingAudio) {
    onboardingAudio = new Audio();
    onboardingAudio.preload = "auto";
    onboardingAudio.playsInline = true;
  }
  return onboardingAudio;
}

function cancelFade() {
  if (fadeFrame) cancelAnimationFrame(fadeFrame);
  fadeFrame = null;
}

function clampVolume(value) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return 0;
  return Math.min(1, Math.max(0, volume));
}

function fadeVolume(audio, targetVolume, durationMs) {
  cancelFade();

  return new Promise((resolve) => {
    const duration = Math.max(0, Number(durationMs || 0));
    const safeTargetVolume = clampVolume(targetVolume);
    const startVolume = clampVolume(audio.volume || 0);
    const startTime = performance.now();

    if (!duration) {
      audio.volume = safeTargetVolume;
      resolve();
      return;
    }

    const tick = (now) => {
      const progress = Math.min(1, Math.max(0, (now - startTime) / duration));
      audio.volume = clampVolume(startVolume + (safeTargetVolume - startVolume) * progress);

      if (progress < 1) {
        fadeFrame = requestAnimationFrame(tick);
      } else {
        fadeFrame = null;
        resolve();
      }
    };

    fadeFrame = requestAnimationFrame(tick);
  });
}

export default function useOnboardingAudio({ open, targetKey = "home_onboarding_intro" }) {
  const [musicAsset, setMusicAsset] = useState(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);

  const loadMusic = useCallback(async () => {
    const assets = await base44.entities.MusicAsset.filter({ targetKey, status: "active" }, "-updatedAt", 1);
    const asset = assets.find((item) => item.enabled !== false) || null;
    const audio = getAudio();

    setMusicAsset(asset);

    if (asset?.fileUrl && audio) {
      if (audio.src !== asset.fileUrl) audio.src = asset.fileUrl;
      audio.loop = asset.loop !== false;
      audio.preload = "auto";
      audio.load();
    }
  }, [targetKey]);

  const playMusic = useCallback(async ({ restart = false } = {}) => {
    const audio = getAudio();
    if (!audio || !musicAsset?.fileUrl || musicAsset.enabled === false || musicAsset.autoplay === false) return false;

    cancelFade();
    if (audio.src !== musicAsset.fileUrl) audio.src = musicAsset.fileUrl;
    audio.loop = musicAsset.loop !== false;
    audio.muted = false;
    audio.volume = clampVolume(0);

    if (restart) audio.currentTime = Number(musicAsset.startAtSeconds ?? 0);

    try {
      await audio.play();
      setMusicEnabled(true);
      setAutoplayBlocked(false);
      await fadeVolume(audio, clampVolume(musicAsset.volume ?? 0.65), Number(musicAsset.fadeInMs ?? 1500));
      return true;
    } catch {
      setMusicEnabled(false);
      setAutoplayBlocked(true);
      return false;
    }
  }, [musicAsset]);

  const stopMusic = useCallback(async ({ reset = true, fade = true } = {}) => {
    const audio = getAudio();
    if (!audio) return;

    cancelFade();
    if (!audio.paused && fade) {
      await fadeVolume(audio, 0, Number(musicAsset?.fadeOutMs ?? 1000));
    }

    audio.pause();
    if (reset) audio.currentTime = 0;
    setMusicEnabled(false);
    setAutoplayBlocked(false);
  }, [musicAsset]);

  const replayMusic = useCallback(() => playMusic({ restart: true }), [playMusic]);

  const enableAudio = useCallback(async () => {
    userAudioSeeded = true;
    return playMusic({ restart: false });
  }, [playMusic]);

  useEffect(() => {
    loadMusic();
    const unsubscribe = base44.entities.MusicAsset.subscribe((event) => {
      if (event?.data?.targetKey === targetKey || event?.type === "delete") loadMusic();
    });

    return () => unsubscribe?.();
  }, [loadMusic, targetKey]);

  useEffect(() => {
    const seedAudio = () => {
      userAudioSeeded = true;
      const audio = getAudio();
      if (!audio || !audio.src || !audio.paused) return;

      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {
        audio.muted = false;
      });
    };

    window.addEventListener("pointerdown", seedAudio, { once: true, capture: true });
    window.addEventListener("touchstart", seedAudio, { once: true, capture: true });
    window.addEventListener("keydown", seedAudio, { once: true, capture: true });

    return () => {
      window.removeEventListener("pointerdown", seedAudio, { capture: true });
      window.removeEventListener("touchstart", seedAudio, { capture: true });
      window.removeEventListener("keydown", seedAudio, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (open) {
      playMusic({ restart: true });
    } else {
      stopMusic({ reset: true, fade: true });
    }
  }, [open, playMusic, stopMusic]);

  useEffect(() => {
    return () => {
      stopMusic({ reset: true, fade: false });
    };
  }, [stopMusic]);

  return {
    musicAsset,
    autoplayBlocked,
    musicEnabled,
    userAudioSeeded,
    enableAudio,
    replayMusic,
    stopMusic,
  };
}
