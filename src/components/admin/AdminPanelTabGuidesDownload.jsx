import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

const masterTabs = [
  ["Master Dashboard", "Platform snapshot for tenants, tickets, vendors, modules, health, and launch readiness."],
  ["Home Gateway", "Manage the platform-owned landing/home gateway content and publishing state."],
  ["Pages", "Review and manage platform page configurations, content slots, media slots, SEO, and page publishing."],
  ["Users & Access", "Review access rules, roles, permission grants, and user governance for platform operations."],
  ["Experience Layer", "Manage shared experience architecture, presets, routing logic, and visitor experience standards."],
  ["All Modules", "View all business modules and their platform-level configuration coverage."],
  ["Walkthrough Policy", "Control walkthrough module policy, tenant routing, and tour-builder governance."],
  ["Onboarding", "Configure onboarding module behavior and entry-flow expectations."],
  ["Ticketing", "Review ticketing module settings and tenant ticket readiness."],
  ["AI Guide", "Manage AI guide module policy and tenant guide readiness."],
  ["Vendors", "Review vendor module setup, approvals, and marketplace readiness."],
  ["Commerce", "Review commerce module readiness and shopping/partner experience configuration."],
  ["Analytics", "Review platform analytics module readiness and reporting coverage."],
  ["Gamification", "Review gamification module settings and engagement-system readiness."],
  ["All Services", "Overview of identity, CMS, AI, notifications, search, payments, and integrations services."],
  ["Identity", "Review authentication, access, tenant login, and identity service expectations."],
  ["CMS", "Review content management service responsibilities and publishing dependencies."],
  ["AI & Personalization", "Review AI service capabilities, personalization boundaries, and module dependencies."],
  ["Notifications", "Review notification service behavior and outbound communication readiness."],
  ["Search", "Review search service scope and discoverability expectations."],
  ["Payments", "Review payment-service responsibilities and commercial readiness areas."],
  ["Integrations", "Review external connector and integration service coverage."],
  ["Content Overview", "Review content/data governance and platform content inventory status."],
  ["Exhibits", "Review exhibit content configuration and platform content structure."],
  ["Media Library", "Review media assets, registry items, assignments, and content health."],
  ["Music Templates", "Manage platform music/audio templates and reusable sound assignments."],
  ["Animations", "Review animation content categories and related metadata."],
  ["Characters", "Review character content records and storytelling assets."],
  ["Stations", "Review station/location content used by immersive experiences."],
  ["Metadata", "Review taxonomy, labels, tags, and structured content metadata."],
  ["Version Control", "Review content versioning and revision-management expectations."],
  ["System Health", "Review infrastructure status, alerts, services, and operational health."],
  ["Testers Feedback", "Review QA/test feedback reports and resolution status."],
  ["Tenant Registry", "Create, view, update, open, brand, and delete museum tenants."],
  ["White Label", "Manage platform and tenant branding options."],
  ["Architecture Blueprint", "Review system architecture, route integrity, and platform design structure."],
  ["Tenant Admin Console", "Shortcut into the tenant admin console for a museum tenant."],
];

const tenantTabs = [
  ["Dashboard", "Tenant-specific operational summary for the selected museum."],
  ["Museum Home", "Edit, save draft, preview, and publish the public museum home page."],
  ["Experience Builder", "Configure tenant walkthrough rooms, scenes, media, quality checks, and publishing readiness."],
  ["Tickets", "Review tenant ticket records, statuses, visitor details, and visit information."],
  ["Vendors", "Review tenant vendor registrations, approvals, categories, and marketplace records."],
  ["Exhibits", "Manage tenant exhibit records and cultural content entries."],
  ["Music", "Manage tenant-owned audio/music assets and page or overlay assignments."],
  ["Analytics", "Review tenant-level activity, module performance, and visitor data views."],
];

const experienceBuilderGuide = [
  ["Start Here", "The Experience Builder lets you create a public museum walkthrough. Build room by room, upload strong media, preview before publishing, check mobile and desktop, and publish only when the visitor journey works from beginning to end."],
  ["Choose Your Mode", "Very Easy is for upload, auto-fill, preview, and publish. Easy is for guided editing of text, media, room order, CTA buttons, and simple behavior. Expert is for full control over room logic, media slots, artifacts, audio, hotspots, CTA routing, accessibility, and advanced checks."],
  ["Very Easy Guide", "Open Tenant Admin, choose the museum, open Experience Builder, select Very Easy, click Auto Fill Whole Museum, upload one clear media file per room, turn on scrollable left/right for wide rooms, generate the extended background, review the final stitched panorama, approve only if it looks seamless, preview the whole museum, then publish."],
  ["Easy Guide", "Select Easy, review the room list, add or reorder rooms, edit title, description, guide note, media, background music, CTA buttons, scrollable image settings, save draft, preview the full visitor path, fix warnings, and publish."],
  ["Expert Guide", "Confirm tenant ID, walkthrough key, route, journey map, room order, room type, background and foreground media, artifacts, hotspots, narration, ambience, CTA routing, accessibility, mobile and desktop behavior, raw panel preview, stitched panorama preview, QA score, manifest, publish readiness, then preview and publish."],
  ["Media Upload Rules", "Best images are clear, high resolution, not too cropped, consistently lit, and show a room, wall, mural, gallery, object, scenery, or exhibit. Avoid blurry, very low-resolution, fisheye, glare-heavy, text-heavy, or edge-critical images."],
  ["Scrollable Image Rules", "Use scrollable images for wide rooms, gallery walls, murals, maps, scenery, panoramic exhibits, hotel rooms, museum halls, and long walls. Do not use them for portraits, small objects, close-up products, text-heavy posters, or images with people near the edges."],
  ["Scrollable Approval Checklist", "Approve only if the final panorama looks like one image, has no vertical lines, keeps wall/floor angle, lighting, scale, and perspective, has no warped objects, and feels smooth on mobile and desktop."],
  ["Preview Checklist", "Check first room load, background media, readable text, visible buttons, Next and Exit, audio volume, mobile layout, desktop layout, seamless scrollable images, no broken media, no placeholder text, correct CTA routes, and final room exit."],
  ["Publish Checklist", "All rooms complete, all media uploaded, required text filled, scrollable images approved, CTAs route correctly, mobile and desktop checked, no critical warnings, full journey tested, and tenant confirms readiness."],
  ["Troubleshooting", "If you see a vertical seam, regenerate with lower randomness and lower object density. If the room changes, use same room realistic and lower randomness. If public does not match admin preview, confirm scrollable_image_extended_url is saved and used by the public renderer."],
  ["What Good Looks Like", "A good scrollable image looks like the camera naturally panned left and right in the same space. A bad one looks like three joined images with changed lighting, broken walls, warped objects, repeated furniture, or mismatched floor texture."],
];

const addWrappedText = (doc, text, x, y, width, lineHeight = 6) => {
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

export default function AdminPanelTabGuidesDownload() {
  const downloadGuide = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = 18;

    const ensureSpace = (needed = 24) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = 18;
      }
    };

    const section = (title, rows) => {
      ensureSpace(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(title, margin, y);
      y += 8;

      rows.forEach(([name, guide], index) => {
        ensureSpace(24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(`${index + 1}. ${name}`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        y = addWrappedText(doc, guide, margin + 4, y, contentWidth - 4, 5) + 4;
      });
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Admin Panel Tab Guides", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = addWrappedText(doc, "A practical operating guide for the Master Admin Panel, Tenant Admin Panel, and Experience Builder from setup through public publishing.", margin, y, contentWidth, 5) + 6;

    section("Master Admin Panel", masterTabs);
    section("Tenant Admin Panel", tenantTabs);
    section("Experience Builder Operating Guide", experienceBuilderGuide);

    doc.save("experience builder operating guide.pdf");
  };

  return (
    <Button type="button" variant="outline" onClick={downloadGuide} className="border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
      <FileDown className="h-3.5 w-3.5" /> Download Experience Builder Guide
    </Button>
  );
}