import PortalRevealVisual from "./visuals/PortalRevealVisual";
import PlatformHubVisual from "./visuals/PlatformHubVisual";
import VisitorPathVisual from "./visuals/VisitorPathVisual";
import MuseumDirectoryVisual from "./visuals/MuseumDirectoryVisual";
import MagicalDoorVisual from "./visuals/MagicalDoorVisual";
import StoryTitlesVisual from "./visuals/StoryTitlesVisual";
import AIGuideVisual from "./visuals/AIGuideVisual";
import CommerceFlowVisual from "./visuals/CommerceFlowVisual";
import ExperienceBuilderVisual from "./visuals/ExperienceBuilderVisual";
import MediaArtifactVisual from "./visuals/MediaArtifactVisual";
import DeterministicGridVisual from "./visuals/DeterministicGridVisual";
import QASentinelVisual from "./visuals/QASentinelVisual";
import AnalyticsGrowthVisual from "./visuals/AnalyticsGrowthVisual";
import FinalActivationVisual from "./visuals/FinalActivationVisual";

const VISUALS = {
  portal_reveal: PortalRevealVisual,
  platform_hub: PlatformHubVisual,
  visitor_path: VisitorPathVisual,
  museum_directory: MuseumDirectoryVisual,
  tenant_home: MagicalDoorVisual,
  walkthrough_room: StoryTitlesVisual,
  ai_guide: AIGuideVisual,
  commerce_flow: CommerceFlowVisual,
  experience_builder: ExperienceBuilderVisual,
  media_artifact: MediaArtifactVisual,
  deterministic_grid: DeterministicGridVisual,
  qa_sentinel: QASentinelVisual,
  analytics_growth: AnalyticsGrowthVisual,
  final_activation: FinalActivationVisual,
};

export default function ScoversOnboardingVisual({ visualType, slide, reduceMotion = false }) {
  const Visual = VISUALS[visualType] || PortalRevealVisual;
  return <Visual slide={slide} reduceMotion={reduceMotion} />;
}