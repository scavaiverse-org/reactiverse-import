import OnboardingGuideRoom from "./OnboardingGuideRoom";
import ArtifactRoom from "./ArtifactRoom";
import ExhibitionRoom from "./ExhibitionRoom";
import GamificationRoom from "./GamificationRoom";
import ReflectionChamberRoom from "./ReflectionChamberRoom";
import AIConversationRoom from "./AIConversationRoom";
import PerformanceStageRoom from "./PerformanceStageRoom";
import TimelineRoom from "./TimelineRoom";
import ArchiveRoom from "./ArchiveRoom";
import BranchingChoiceRoom from "./BranchingChoiceRoom";
import MemoryCollectionRoom from "./MemoryCollectionRoom";
import FinaleRoom from "./FinaleRoom";
import ThreeDWorldRoom from "./ThreeDWorldRoom";

export default function renderRoomByType(room, context = {}) {
  const props = { room, context, ...context };
  switch (room?.page_type) {
    case "onboarding_guide": return <OnboardingGuideRoom {...props} onNext={context.next} onChoice={context.choice} />;
    case "artifact_room": return <ArtifactRoom {...props} onArtifactOpen={context.artifactOpen} />;
    case "walkthrough_exhibition": return <ExhibitionRoom {...props} activeHotspot={context.activeHotspot} onHotspotOpen={context.hotspotOpen} />;
    case "gamification_page": return <GamificationRoom {...props} onGameStart={() => context.track?.("walkthrough_game_started")} onComplete={() => context.track?.("walkthrough_game_completed")} />;
    case "reflection_chamber": return <ReflectionChamberRoom {...props} />;
    case "ai_conversation_room": return <AIConversationRoom {...props} />;
    case "performance_stage": return <PerformanceStageRoom {...props} />;
    case "timeline_room": return <TimelineRoom {...props} />;
    case "archive_room": return <ArchiveRoom {...props} />;
    case "branching_choice_room": return <BranchingChoiceRoom {...props} />;
    case "memory_collection_room": return <MemoryCollectionRoom {...props} />;
    case "finale_room": return <FinaleRoom {...props} />;
    case "three_d_world": return <ThreeDWorldRoom {...props} />;
    default: return <ExhibitionRoom {...props} activeHotspot={context.activeHotspot} onHotspotOpen={context.hotspotOpen} />;
  }
}