# Klin Studio

Next.js 15 (App Router) · FR/EN · scène 3D persistante · admin · blog projets (`/fr|en/blog/slug`).

## Démarrage
1. `cp .env.example .env.local` et remplir (Mongo, Cloudinary, Gmail, admin, `SITE_URL`, `SESSION_SECRET`, `CRON_SECRET`).
2. Déposer vos musiques calmes dans `public/sounds/` (mp3/ogg/wav/m4a). Le liquide réagit à leurs basses.
3. `npm install && npm run dev` puis `/admin`.

## Structure
- `components/Experience.jsx` : scène R3F (liquide audio-réactif, voiles au même shader, rocher, nuages drei, lumière, zoom au scroll).
- `lib/audio.js` : analyseur partagé ; `components/AudioPlayer.jsx` : son opt-in, aléatoire, pause/suivant.
- `lib/media.js` + `lib/admin.js` : médias sans orphelins (tag `pending` tant que non enregistré, suppression à l'édition/suppression, annulation nettoie, échecs rejoués, purge quotidienne via `vercel.json`).
- `app/[lang]/blog/[slug]` : étude de cas façon article (metadata, hreflang, JSON-LD, sitemap).
- `app/api/booking` : formulaire 3 étapes, honeypot, limite de débit, emails Gmail.
- Sécurité : CSP/HSTS dans `next.config.mjs`, hôtes autorisés dans `middleware.js`, session HMAC HttpOnly.

## Accueil
Parcours : intro (portail drei, eau uniquement ici) → zoom → un portail circulaire s'ouvre et on le traverse → mur de cuir en défilement horizontal (le scroll vertical fait « marcher » devant les cadres-projets). Les cadres 3D se calent sur les éléments HTML `[data-frame]` (liens réels, SEO) ; `[data-story]` pilote les phases. Dessins SVG et fil de la méthode se tracent selon le scroll.

## Assets 3D
Rocher : `public/boulder_rock_3d_model_free.glb` (normalisé automatiquement ; rocher procédural de secours s'il est absent). Polices : Tenor Sans (titres) + Jost (texte), auto-hébergées via @fontsource. Défilement lissé : Lenis ; phases 3D lissées par lerp.

## ExperienceTest.jsx (essai, non utilisé)
Variante de `Experience.jsx` avec optimisations sans perte de rendu + titre « transpirant ». À copier manuellement dans `Experience.jsx` pour l'essayer (voir l'en-tête du fichier).

## Cloudinary
Dossiers : `klin-studio/projects` (médias, tags `klin-studio-media` + `pending`) et `klin-studio/sounds` (sons, tag `klin-studio-sound`). Erreur 403 « missing permissions (actions=["create"]) » = la **clé API** n'a pas le droit de créer : Console → Settings → API Keys → donner les droits d'upload/création (ou créer une clé « Master »), puis mettre à jour `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`. Admin → Maintenance → « Tester Cloudinary » diagnostique.

## Admin (/admin)
Projets (médias ≤ 10, sans orphelins), Demandes (statuts, accepter/refuser + email, répondre), Textes FR/EN (surcharge de `lib/content.js`), Emails (envoi + historique), Sons (musiques de l'intro, 20 max), Maintenance (purge).

Les médias et sons sont envoyés directement du navigateur vers Cloudinary (envoi signé, `/api/admin/sign`) pour éviter la limite de 4,5 Mo des fonctions Vercel. Médias : dossier `klin` + tag `pending` jusqu'à l'enregistrement (purgés sinon) ; sons : dossier `klin-sounds`, jamais purgé.

## Sécurité
Middleware : limite par IP (ban 10 min), filtrage de robots de copie, aucun blocage de host (vercel.app OK). `next.config.mjs` : CSP, HSTS, COOP, noai. `robots.js` : crawlers IA bloqués. Note : la limite est en mémoire par instance ; pour du renforcé, activer le WAF/Rate Limiting Vercel ou Upstash. Aucune protection ne peut empêcher totalement la copie de contenu visible.

## Navigation
Tige de menu verticale (`components/MenuRod.jsx`) : point de progression du scroll, panneau plein écran ; liens présents dans le HTML (SEO).

## Déploiement Vercel
Variables : celles de `.env.example` + `CRON_SECRET` (purge quotidienne, `vercel.json`). `SITE_URL` = URL publique (SEO, sitemap). Aucun blocage de host. Définir `ALLOWED_HOSTS` n'est plus nécessaire.

## À vérifier au premier lancement
Alignement cadres 3D / liens HTML (`Frame` dans `Experience.jsx`), poids de la 3D sur mobile, envoi d'emails Gmail (mot de passe d'application), CORS audio Cloudinary.

## À compléter
Textes provisoires (délais, tarifs, mentions légales) via l'onglet Textes de l'admin.
