This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Six Degrees of Cinema

This project is a French-language cinema connection game. The player connects two actors through films and cast members. The confirmed stack is React Native, Expo EAS, TMDB, Firebase, and GitHub. The initial milestone is a solo playable MVP. Product rules such as eligible credits, actor repetition, and score validation remain proposals until confirmed.

The current visual direction is near-black with vivid red (`#0C0C0F`, `#FF3256`), large film imagery, and strong typography. Preserve this direction when building screens.

Project instructions and product context also live in `CHATGPT_PROJECT_INSTRUCTIONS.md`. Read it when a task touches product scope or unresolved rules.

## Project-specific constraints

- This repository uses the root `app/` directory with Expo Router; routes live there, and shared code belongs outside it.
- Use the Expo skills under `.agents/skills/` for framework-specific work. Start Expo tasks with `expo-overview`, then load only the relevant focused skills.
- Use `npx expo install <package>` for dependencies that need to match the current Expo SDK.
- Never add TMDB access tokens or other server secrets to client code, `EXPO_PUBLIC_*` variables, screenshots, or committed files. Firebase client configuration is not a substitute for security rules.
- Do not claim that a connection is the shortest unless it is verified against a documented data and ruleset. A future backend must validate game rules and competitive scores.
- The original TMDB bearer token was removed from the local Bruno collection; revoke it in TMDB and use a new credential only in a secure local/server environment.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run the typecheck and any lint commands that are configured in the repository before declaring code changes done. A linter is not configured in the current scaffold.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `app/` — route files there define screens and `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
