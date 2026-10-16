# Six Degrees of Cinema

Application mobile iOS et Android pour relier des acteurs par les films de leur distribution.

## Stack

- React Native avec Expo SDK 58 et Expo Router
- TypeScript
- TMDB comme source de données cinéma, intégration à réaliser derrière une couche serveur pour protéger les identifiants et valider les règles
- Firebase SDK installé ; les services Firebase précis et leur configuration restent à définir
- Expo EAS pour les builds et la distribution
- GitHub comme hébergeur du dépôt et des changements

## Prérequis

- Node.js 24.12 ou supérieur (Expo SDK 58 et Firebase SDK actuels)
- npm
- iOS Simulator avec Xcode ou un appareil Android avec Android Studio pour les builds locaux ; Expo Go peut servir au démarrage

## Démarrage

```sh
npm ci
npm start
```

Puis appuie sur `i` pour ouvrir le simulateur iOS, `a` pour Android ou `w` pour le web.

## Configuration Firebase

Copie `.env.example` vers `.env` et renseigne les paramètres de l’application Web Firebase. Ces valeurs de configuration sont intégrées au client Expo : elles ne doivent jamais contenir de secrets de serveur. Les règles de sécurité et les services Firebase ne sont pas encore configurés.

Ne place pas le jeton d’accès TMDB dans une variable `EXPO_PUBLIC_*` : les variables préfixées ainsi sont visibles dans l’application distribuée. La connexion TMDB devra passer par un backend ou un autre mécanisme serveur approuvé.

## Structure

- `app/` : routes Expo Router et écrans
- `components/` : composants d’interface réutilisables
- `constants/` : couleurs du thème
- `src/lib/` : intégrations et infrastructure, dont Firebase
- `.agents/skills/` : skills IA embarqués dans le dépôt
- `TMDB/` : collection Bruno locale, sans identifiant réel

## Builds EAS

Les profils `development`, `preview` et `production` sont déclarés dans `eas.json`. Le projet EAS n’est pas encore lié à un compte ni à un identifiant EAS ; configure-le avec `eas build:configure` après connexion au compte Expo du projet.

Les identifiants de bundle `com.sixdegrees.cinema` sont provisoires et devront être vérifiés avant la publication.

## Instructions pour les agents IA

Lire `AGENTS.md` avant de modifier le code. Les skills projet sont dans `.agents/skills/` et leurs sources sont répertoriées dans `skills-lock.json`.
