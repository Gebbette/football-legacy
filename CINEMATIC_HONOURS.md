# Cinematic honours

Open `ceremony-preview.html` to replay all seven ceremony families. The regular game still opens through `index.html`.

Presentation is shared by Original, Express, Quick Story and Multiplayer through `honours-cinema.js`, `honours-cinema.css` and seven SVG artworks in `assets/honours/`. No runtime dependency or external font was added.

The Premier League, Champions League, World Cup, Ballon d’Or, The Best, domestic cups and other individual honours each have an opening, trophy reveal, winner reveal and stationary final frame. Skip reveals the final frame without advancing the game; Continue keeps its original host handler. Reduced motion renders the final frame immediately, including when the preference changes while a ceremony is running.

Original and Express now invoke the presentation after an actual final win. Their late legacy fixture implementation previously recorded the trophy silently. This new call consumes no gameplay randomness. Existing award flashes retain the original random draws where the old confetti used them. Delayed awards queue behind an active ceremony.

Gameplay, simulation, transfers, award probabilities, save formats, review order, network protocol, and multiplayer readiness rules are preserved. `multiplayer.js` is byte-identical to the supplied archive.

Verified in headless Microsoft Edge at 390×844 and 1440×900, with repeated animation captures and visual revisions. Additional 320×568, long-name, keyboard, reduced-motion, lifecycle and actual Original/Express final-win checks passed. The 1,800-career internal suite (36,044 seasons), 72 complete seeded comparisons, Original/Express QA suites and multiplayer protocol/private-review checks passed. No external two-device multiplayer session was run.
