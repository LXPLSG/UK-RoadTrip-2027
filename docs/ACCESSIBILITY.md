# Accessibility Review

The production target is WCAG 2.2 AA for core planning and travel workflows.

## Implemented

- Semantic sidebar, main content and mobile navigation landmarks.
- Skip link and visible keyboard focus indicators.
- Native buttons, links, form controls and checkbox labels.
- Minimum 40–44 pixel interactive controls, with larger travel-mode targets.
- Modal focus trapping, Escape dismissal and focus restoration.
- Polite status announcements for saves, imports and errors.
- `aria-current` navigation state and `aria-pressed` segmented controls.
- Light, dark, reduced-motion and forced-color support.
- Text alternatives for meaningful imagery and hidden decorative icons.
- Print output that retains readable hierarchy without application chrome.

## Verification Checklist

- Complete every CRUD workflow with keyboard only.
- Verify headings and landmarks with a screen reader.
- Confirm 200% browser zoom without horizontal document scrolling.
- Confirm touch controls at 320 CSS pixels wide.
- Recheck contrast whenever design tokens change.
