# Six Degrees of Cinema

Application mobile iOS et Android pour relier des acteurs par les films de leur distribution.

## Stack

- React Native avec Expo SDK 58 et Expo Router
- TypeScript
- TMDB comme source des acteurs, films, crédits et images
- Firebase SDK installé ; les services Firebase précis et leur configuration restent à définir
- Expo EAS pour les builds et la distribution
- GitHub comme hébergeur du dépôt et des changements

## Prérequis

- Node.js 24.12 ou supérieur (Expo SDK 58 et Firebase SDK actuels)
- npm
- iOS Simulator avec Xcode ou un appareil Android avec Android Studio pour les builds locaux

## Démarrage de l’application

```sh
npm ci
npm start
```

Pour les fonctions natives, lance un build de développement EAS ; Expo Go ne contient pas les modules natifs du projet.

## Accès TMDB en développement

Firebase n’est pas nécessaire pour lancer une partie en développement. Dans une copie locale non suivie par Git, renseigne `EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN` dans `.env.local` pour appeler TMDB directement depuis l’application. `.env.local` est ignoré par Git.

Cette méthode sert uniquement aux builds de développement : toute variable `EXPO_PUBLIC_*`, même créée comme secrète dans Expo EAS, est intégrée au binaire de l’application et peut en être extraite. N’utilise pas cette méthode pour distribuer une version publique. En production, l’application utilise les Cloud Functions Firebase et le jeton stocké dans Firebase Secret Manager.

Copie `.env.example` vers `.env.local`, puis renseigne le jeton de lecture TMDB dans ce fichier. Expo charge `.env.local` au démarrage. Ne colle pas le jeton dans une conversation et ne le committe pas.

Même une variable marquée « secret » dans Expo EAS ne reste pas secrète une fois préfixée par `EXPO_PUBLIC_` : Expo l’intègre dans le binaire afin que l’application puisse la lire. Cette méthode est réservée aux essais du build de développement.

## Backend TMDB (Firebase Functions)

L’application appelle trois fonctions HTTPS Firebase : `searchActors`, `getActorMovies` et `getMovieCast`. Le jeton Bearer TMDB est lu uniquement par les fonctions via Firebase Secret Manager. L’application requiert les paramètres client Firebase de `.env.example`.

Après avoir créé/sélectionné le projet Firebase et configuré une app iOS/Android :

```sh
npx firebase-tools login
npx firebase-tools use --add
cd functions && npm install && npm run build
cd ..
npx firebase-tools functions:secrets:set TMDB_READ_ACCESS_TOKEN
npx firebase-tools deploy --only functions
```

Les Cloud Functions requièrent le plan Firebase Blaze. Les fonctions imposent App Check ; il faut enregistrer les apps mobiles et configurer l’attestation native avant que les appels de production réussissent. Le typecheck du client et la compilation des fonctions se lancent séparément.

Les données sont attribuées à TMDB dans l’onglet Règles. Avant toute diffusion publique, ajouter le logo TMDB officiel dans une section crédits et vérifier les conditions applicables au projet.

## Structure

- `app/` : routes Expo Router et écrans
- `components/` : composants d’interface réutilisables
- `constants/` : couleurs du thème
- `src/lib/` : intégrations et infrastructure, dont Firebase
- `.agents/skills/` : skills IA embarqués dans le dépôt
- `TMDB/` : collection Bruno locale, sans identifiant réel

## Builds EAS

Les profils `development`, `preview` et `production` sont déclarés dans `eas.json`. Le profil `development` produit un development build iOS pour simulateur ; `production` produit le binaire destiné à App Store Connect et incrémente le numéro de build distant. Le projet est lié au compte Expo `olivier9925`.

L’identifiant iOS `com.olivier9925.sixdegreesofcinema` est enregistré dans Apple Developer et associé à la fiche App Store Connect. Le package Android reste `com.sixdegrees.cinema`.

Après connexion à EAS (`npx eas-cli@latest login`) et configuration des identifiants de signature Apple (`npx eas-cli@latest credentials --platform ios`), les commandes iOS sont :

```sh
npm run eas:build:ios
npm run eas:submit:ios
```

Pour construire puis envoyer automatiquement le build, utilise `npm run eas:release:ios`. La première soumission peut demander de sélectionner l’app ou de configurer une clé App Store Connect. L’envoi à App Store Connect ne soumet pas automatiquement l’app à la revue publique ; cette étape se fait dans App Store Connect.

## Instructions pour les agents IA

Lire `AGENTS.md` avant de modifier le code. Les skills projet sont dans `.agents/skills/` et leurs sources sont répertoriées dans `skills-lock.json`.
