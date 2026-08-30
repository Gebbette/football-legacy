# Football Legacy Website Beta — Test Report

Date: 30 August 2026

## Passed static regression checks
- All required website files are present.
- No broken relative links were found across HTML pages.
- Every inline JavaScript block passes `node --check` syntax validation.
- Original Career contains its separate `footballLegacy_original_slot_` save namespace.
- Career Express contains its separate `footballLegacy_express_slot_` save namespace.
- Quick Story retains its own `footballLegacy_quick_story_v1` save namespace.
- Original and Express still contain autosave code.
- All three game pages contain the calendar code from V5.
- The long-career mobile viewport no longer disables browser zoom with `maximum-scale=1`.
- No `fetch()` or `XMLHttpRequest` calls are present in the game pages.
- No Google Analytics, Google Tag Manager, Facebook Pixel, AdSense or DoubleClick markers were found.
- Privacy page includes a control that removes only `footballLegacy*` local-storage keys.
- The game logic itself was decoded directly from the previously tested V5 Website Ready build; the website pass changes site chrome/metadata/legal pages rather than rebalancing the simulation.

## Browser-test limitation in this environment
The container's Chromium networking is administratively blocked for local `http://127.0.0.1` and `file://` navigation, so a fresh automated rendered-browser pass could not be completed here. The prior V5 core build had already received browser interaction testing; this website pass therefore used syntax, link-integrity, storage, privacy and regression-marker checks.

## Final manual checks on the live domain
After upload and HTTPS activation, test on Safari/iPhone and one desktop browser:
1. Open each mode.
2. Start a career.
3. Check the calendar and month arrows.
4. Simulate one fixture in Original and one month in Express.
5. Refresh and resume an autosave.
6. Confirm Original and Express saves do not overwrite each other.
7. Finish/share a Quick Story career.
8. Open Privacy, Terms, Legal and Accessibility from the website.
9. Clear a test save from Privacy and confirm only Football Legacy data is removed.
10. Test the custom 404 page by visiting a made-up URL.
