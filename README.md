# React Native App (Expo)

This project is set up to ship on **Android + iOS** from a single codebase.

## Project structure

- `src/application/` – app composition (providers, navigation)
- `src/screens/` – screens
- `src/shared/` – shared UI + theme
- `src/services/` – API clients
- `src/store/` – state (zustand)

## Run locally

```bash
npm install
npm run start
```

## Android / iOS (Expo Go)

```bash
npm run android
npm run ios
```

## Production builds (EAS)

1) Login:

```bash
npx eas login
```

2) Set unique IDs in `app.json`:

- `expo.ios.bundleIdentifier`
- `expo.android.package`

3) Build:

```bash
npx eas build -p android --profile preview
npx eas build -p ios --profile preview
```

