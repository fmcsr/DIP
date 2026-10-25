import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.deeprionlabs.flowcount',
  appName: 'Flow Count',
  webDir: 'dist',
  // Same as the app surface, so no light flash shows before the first frame.
  backgroundColor: '#0a0a0c',
  ios: {
    // Nothing in the app scrolls; this also removes the rubber-band bounce.
    scrollEnabled: false,
  },
  plugins: {
    SystemBars: {
      // The UI reads env(safe-area-inset-*) directly, so the injected --safe-area-inset-* variables aren't needed.
      insetsHandling: 'native',
      // Light status and navigation bar icons on the dark surface (Android).
      style: 'DARK',
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
