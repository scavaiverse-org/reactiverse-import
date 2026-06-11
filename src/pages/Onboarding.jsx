import { useCallback, useState } from "react";
import CinematicEnvironment from "../components/onboarding/CinematicEnvironment";
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const navigate = useNavigate();
  const [context, setContext] = useState({ progress: 0, backgroundUrl: "" });
  const handleContextChange = useCallback((next) => setContext(next), []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <CinematicEnvironment progress={context.progress} backgroundUrl={context.backgroundUrl} />
      <OnboardingFlow onNavigate={navigate} onContextChange={handleContextChange} className="max-w-3xl" />
    </div>
  );
}
