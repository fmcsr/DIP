# Flow Count

A calm, distraction-free counter for meditation, breathwork and everyday tracking, for iOS and Android. The counter is a circle: tap it to add one, and it answers like a drop falling into still water. Set a target to count in rounds, up or down, and pick the color, the mode and the tap effect that suit the moment.

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

`npm run ios` generates the native iOS project, builds it and opens the app in the simulator or on a connected device. It also starts the development server, so code changes show up in the app right away. Use `npm run android` for Android. It needs Java and the location of the Android SDK; if they aren't set up, point them at the ones Android Studio installs:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
```

The `ios/` and `android/` folders are not committed: they are generated from `app.json` (Continuous Native Generation). Native settings belong in `app.json` and Expo config plugins, not in those folders. `npm run ios` and `npm run android` generate a folder only when it is missing, so after changing `app.json` or the icon, run `npx expo prebuild --clean` before the next build.

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

- **Count:** Tap the circle. It sinks slightly, counts when you lift your finger, and plays the chosen tap effect.
- **Move:** Hold the circle for half a second. It lifts with a haptic tick and brightens; then drag it anywhere on screen. It stays inside the safe area and clear of the settings button. Holding and dragging never change the count.
- **Settings:** The gear in the top-right corner opens the settings page; Done closes it, as does a swipe down on iOS or Back on Android. Each setting is a drop-down that opens in place.
  - **Target:** Off (the count just goes on), one of the last three targets you set, or Custom to type a new one up to 99,999 into a field that opens empty. Typing 0 means no target, the same as Off. Picking a target moves it to the top of the list; a fourth new one replaces the target set longest ago. With a target set, the circle shows the current round.
  - **Direction:** Count up from 0 to the target, or down from the target to 0. Reaching the end completes a round: the round number goes up, the count starts over, and the tap effect plays bigger and brighter. Changing the target or the direction restarts the current round and keeps the completed ones.
  - **Reset count:** After a confirmation, the count goes back to the start and the rounds are cleared.
  - **Color:** A grid of swatches in two rows, bright colors above and softer ones below, with as many columns as fit the screen. The chosen color becomes the theme at once: the circle's edge, the tap effects, the selection marks and a faint tint of the backgrounds. The grid stays open, so colors can be tried one after another.
  - **Mode:** Dark or Light. Light mirrors dark: the backgrounds and text swap, while the layout, the chosen color and the effects stay. System dialogs and the keyboard follow the mode.
  - **Tap effect:**
    - **Water drop** (default): the impact flashes, its crater rim spreads to the circle's edge, a train of waves rolls out, and the droplet that bounced back up falls in once more.
    - **Ripple:** clean concentric rings.
    - **Zigzag:** soft-toothed rings that turn as they spread.
    - **Stardust:** the circle gives under the tap and bounces back to its size, while specks of light scatter from its rim, twinkling, with a few glinting stars.
    - **Glow:** the circle lights up from within and breathes a soft wave of light outward, with no hard edge.
    - **Lotus:** two whorls of petals unfold from the circle's edge.
    - **None.**
- **Haptics:** A light tick on every count (the lightest Taptic Engine impact on iOS, the system key-press haptic on Android), a firmer one when the circle is picked up, and a success pattern when a round completes.
- **Reduce Motion:** With the system setting on, the tap effects and transitions don't play.
- **Accessibility:** For VoiceOver and TalkBack the circle is a single "Increase count" button whose value is the current count (and the round, with a target set); every new value is announced, and so is each completed round. With a hardware keyboard, focus the circle and press Enter or Space. Android draws a focus ring around it; iOS Full Keyboard Access shows its own. In settings, each drop-down is a button that says whether it is expanded, and its options are radio buttons.

Settings and the count are kept only while the app is running.

## App icon

The icon is a circle drawn by a sparkler, in one blue on black: brightness changes along the trail, the color doesn't. `scripts/app-icon.swift` draws it and writes `assets/icon.png` and the Android adaptive icon layers, `android-icon-foreground.png` and `android-icon-monochrome.png` (for themed icons); the black background layer is set in `app.json`. To change the icon, edit the script, then on a Mac run:

```bash
swiftc -O scripts/app-icon.swift -o /tmp/app-icon && /tmp/app-icon assets
npx expo prebuild --clean
```

## Project structure

| Path                                | Contents                                                          |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/App.tsx`                       | App state (counter, theme, tap effect) and haptics                |
| `src/components/CounterSurface.tsx` | Full-screen surface: circle size, drag bounds, start hint, gear   |
| `src/components/CounterCircle.tsx`  | The circular counter: tap, hold to move, round label, accessibility |
| `src/components/effects/`           | Tap effects (water drop, ripple, zigzag, stardust, glow, lotus) and their shared clock |
| `src/components/SettingsButton.tsx` | The gear button that opens settings                               |
| `src/components/SettingsSheet.tsx`  | Settings page: target, direction, reset, theme, tap effect        |
| `src/components/Select.tsx`         | Drop-down row that opens its options in place                     |
| `src/components/ColorSelect.tsx`    | Drop-down of color swatches                                       |
| `src/lib/counter.ts`                | Counting rules: target, rounds, up or down, recent targets        |
| `src/lib/useCounter.ts`             | Counter state for the app                                         |
| `src/lib/haptics.ts`                | Haptic feedback                                                   |
| `src/theme.ts`                      | Color palette, dark and light modes, and the theme built from them |
| `scripts/app-icon.swift`            | Draws the app icon and the Android icon layers                    |
| `assets/`                           | App icon, Android icon layers and the splash image                |
| `app.json`                          | App name, identifier (`com.deeprionlabs.flowcount`), icon, splash, orientations |

## Roadmap

- [x] Step 1: Main screen, tap to count, haptics, accessibility
- [x] Circular counter, hold to move, water-drop ripple
- [x] Step 2: More tap effects: water drop, zigzag, stardust, glow and lotus
- [x] Step 3: Settings page, target, rounds, count up or down, reset
- [x] Step 4: Themes: a color palette with dark and light modes
- [ ] Language settings
