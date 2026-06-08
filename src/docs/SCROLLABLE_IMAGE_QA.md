# Scrollable Image Mode QA Checklist

1. Easy Mode upload image → enable scrollable → save → preview → public page drag works.
2. Expert Mode image → enable scrollable → change sensitivity → save → public page drag works.
3. Normal image with toggle off still renders normally.
4. Video upload does not show or apply image scroll controls.
5. Audio upload does not show or apply image scroll controls.
6. Mobile swipe works.
7. Mouse click-drag works.
8. Image does not disappear.
9. Image does not stretch into gray space.
10. Image preserves quality and architecture.
11. Existing tenant rooms remain unchanged because scrollable_image_enabled defaults to false.
12. Public walkthrough does not force panorama mode for every image.

Build/lint status: not run in this environment; verify with `npm run build` and `npm run lint` before release.