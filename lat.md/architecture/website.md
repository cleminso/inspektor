# Website

The website presents the public product and routes product requests under `/conn`. Shared-origin hosting makes website code part of the credential trust boundary.

## Contents

Read the request boundary before changing hosting or adding scripts.

- [Request boundary](#request-boundary)
- [Brand presentation](#brand-presentation)
- [Assets and metadata](#assets-and-metadata)

## Request boundary

The gateway Worker serves website assets and forwards `/conn` and its descendants to the Product Worker. `/connection` remains a website path.

The product asset namespace stays under `/conn`. The Product Worker removes that prefix only for internal asset lookup. Product routes keep their authored `/conn` paths without an additional router base path.

Keeping one origin preserves connection profiles. It also means website JavaScript can reach origin-scoped product credentials. Keep third-party scripts behind a separate security decision.

Website responses enforce browser security headers and a self-only script policy. `no-transform` prevents automatic script injection.

HTML fallback requires a missing asset response and a GET or HEAD document request. Known static asset paths remain excluded. The website returns 404 for unknown document routes even when it renders the SPA shell.

## Brand presentation

[[boundaries#Owners|Workspace boundaries]] assign page assembly to the website and reusable presentation to the design system. The focused `@inspektor/ds/brand` entry keeps brand use separate from the generic component barrel.

Brand parts represent semantic visual units. Keep layout-only wrappers private until consumers need independent composition. The frame owns one continuous main surface; decorative rails and the bottom strip stay outside the accessibility tree.

The hero keeps its primary title and muted continuation inside one `h1`. Visual hierarchy does not create another heading level. Routes supply copy and action content.

The preview receives route-selected, theme-specific image assets and intrinsic dimensions. It owns responsive image presentation, not screenshot selection or an extra visual frame.

## Assets and metadata

The website owns fonts and document metadata. Preload the initial Instrument Sans Latin font from the same Vite-managed source as its font-face declaration.

Vendor the font license with the assets and publish its OFL text at `/licenses/instrumentSans.txt`. Keep private brand color roles behind system or explicit theme selection.
