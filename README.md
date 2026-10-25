# Flow Count

A calm, distraction-free counter for meditation, breathwork and everyday tracking, for iOS and Android. The counter is a circle: tap it to add one, and rings spread out from it like a drop falling into water.

Built with React Native + [Expo](https://expo.dev) (SDK 58) and TypeScript, using React Native Gesture Handler for touch handling and Reanimated for animation.

## Requirements

- Node.js 22.13+ (or 24.3+)
- Xcode for iOS
- Android Studio for Android

## Running

```bash
npm install
npm run ios
```

`npm run ios` generates the native iOS project, builds it and opens the app in the simulator or on a connected device. It also starts the development server, so code changes show up in the app right away. Use `npm run android` for Android. It needs Java; if none is installed, point it at the one that ships with Android Studio:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

The `ios/` and `android/` folders are not committed: they are regenerated from `app.json` on every build (Continuous Native Generation). Native settings belong in `app.json` and Expo config plugins, not in those folders.

| Command             | Description                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `npm run ios`       | iOS development build; runs on a simulator or device                     |
| `npm run android`   | The same for Android                                                     |
| `npm start`         | Starts only the development server (for an installed development build)  |
| `npm run typecheck` | TypeScript check                                                         |
| `npm run lint`      | Oxlint                                                                   |

For a build that runs without the development server, use `npx expo run:ios --configuration Release` or `npx expo run:android --variant release`.

The first iOS build takes a few minutes longer than usual. React Native is compiled from source on iOS (`buildReactNativeFromSource` in `app.json`), because the prebuilt core lacks debug symbols that Gesture Handler needs in Debug builds.

## Using the app

- **Count:** Tap the circle. It sinks slightly, counts when you lift your finger, and three rings spread out from its edge.
- **Move:** Hold the circle for half a second. It lifts with a haptic tick and brightens; then drag it anywhere on screen. It stays inside the safe area. Holding and dragging never change the count.
- **Haptics:** A light tick on every count (the lightest Taptic Engine impact on iOS, the system key-press haptic on Android) and a firmer one when the circle is picked up.
- **Reduce Motion:** With the system setting on, the rings and transitions don't play.
- **Accessibility:** For VoiceOver and TalkBack the circle is a single "Increase count" button whose value is the current count; every new value is announced. With a hardware keyboard, focus the circle and press Enter or Space. Android draws a focus ring around it; iOS Full Keyboard Access shows its own.

## Project structure

| Path                                | Contents                                                          |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/App.tsx`                       | Count state and haptics                                           |
| `src/components/CounterSurface.tsx` | Full-screen surface: circle size, drag bounds and the start hint  |
| `src/components/CounterCircle.tsx`  | The circular counter: tap, hold to move, accessibility            |
| `src/components/Ripple.tsx`         | Water-drop rings sent out on each tap                             |
| `src/lib/haptics.ts`                | Haptic feedback                                                   |
| `src/theme.ts`                      | Colors                                                            |
| `app.json`                          | App name, identifier (`com.deeprionlabs.flowcount`), splash, orientations |

## Roadmap

- [x] Step 1: Main screen, tap to count, haptics, accessibility
- [x] Circular counter, hold to move, water-drop ripple
- [ ] Step 2: More tap effects (particles, glow, scale)
- [ ] Step 3: Hidden settings panel, target, rounds, count up or down, reset
- [ ] Step 4: Cyberpunk, Zen and Minimal themes
- [ ] Language settings
