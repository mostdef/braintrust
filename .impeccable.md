# The Collection — Design Context

## App Description

The Collection is a personal film curation tool for reflective movie watching practice. It's not a streaming app or a social network — it's a personal archive where a cinephile deepens their understanding of their own taste through deliberate selection, real-time watching companionship, and AI-assisted reflection. The textured poster grid represents not off-the-shelf movies but cultural experiences accumulated over years. Every interaction should feel like handling something personally meaningful.

## Users

**Primary**: A serious cinephile who thinks about film as art, not entertainment. Someone who curates their taste deliberately — tracking what they watch, why they watch it, and what it reveals about their sensibilities. Currently single-user with multi-user preparation underway.

**Context**: Opening the app should feel like opening a personal film journal — intimate, warm, reflective. The user is here to engage deeply, not browse casually.

**Job to be done**: Curate cinematic taste through reflective practice — selection, real-time companion experience during watching, and post-watch reflection that feeds back into the taste profile.

## Brand Personality

**Three words**: Curated, Intimate, Cinematic

**Supporting qualities**: Textured, Personal, Contemplative

**Voice**: Confident but not showy. Editorial polish without corporate distance. Speaks like a knowledgeable friend, not a platform.

**Emotional goal**: The warmth of handling a well-worn film journal. Reverence for the collection without preciousness.

## Aesthetic Direction

**Tone**: Apple TV's editorial confidence and typography polish, but with more tangibility and a personal, intimate touch. Not a storefront — a personal archive.

**Theme**: Light mode (current). Dark mode planned as future addition.

**Signature elements**:
- Playfair Display serif for display type — cinematic gravitas
- Procedural fold/grain textures on posters — tactile, analog warmth, these aren't thumbnails
- 3D tilt with light diffraction on hover — physicality, the posters feel like objects
- Gold accents (#ffd700) — standards, favorites, the things that matter most
- Backdrop blurs for depth — layers of focus, not flat surfaces
- Springy easing (cubic-bezier 0.23, 1, 0.32, 1) — responsive but not bouncy

**Anti-references**: Discogs (too utilitarian/database-like). Generic streaming UIs. Social film networks where the social layer overwhelms the personal.

**Colors**: Dark components (#1a1a1a, #161616) on light page. Muted grays for secondary content. Gold for emphasis. Semantic greens/reds for watchlist/ban actions only.

**Typography**: Playfair Display 800 (display), Inter 400-600 (body/UI), Oswald 700 (labels/accents, uppercase).

## Design Principles

1. **Tactile over flat** — Every surface should feel like it has weight and texture. Posters are objects, not thumbnails. Grain, diffraction, and depth are core to the identity.

2. **Reflect, don't scroll** — The interface invites contemplation, not consumption. Generous space, deliberate pacing, no infinite feeds.

3. **Personal archive, not storefront** — This is the user's collection, arranged with care. UI should feel owned and intimate, never like a catalog or marketplace.

4. **Polish without preciousness** — High craft in every detail (typography, easing, textures) but never so delicate that it gets in the way. The tool serves the practice.

5. **Accessible by default** — WCAG AA baseline. Respect `prefers-reduced-motion`. Multi-user is coming — build for everyone from the start.
