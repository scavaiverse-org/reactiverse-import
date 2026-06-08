import { useCallback, useEffect, useState } from "react";

export default function useFirstVisit(storageKey = "scaverse_home_intro_seen_v1") {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey) === "true";
    setIsOpen(!seen);
    setHasChecked(true);
  }, [storageKey]);

  const markSeen = useCallback(() => {
    localStorage.setItem(storageKey, "true");
  }, [storageKey]);

  const closeOnboarding = useCallback(() => {
    markSeen();
    setIsOpen(false);
  }, [markSeen]);

  const openOnboarding = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    hasChecked,
    openOnboarding,
    closeOnboarding,
    markSeen,
  };
}