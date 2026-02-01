# Mobile App Build Guide

This guide explains how to build and publish Expense.OS to the Google Play Store and Apple App Store.

## 📱 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App                               │
│                   (Static Export → /out)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Capacitor                                │
│              (Wraps web app in native container)                 │
└─────────────────────────────────────────────────────────────────┘
              ↓                                    ↓
┌─────────────────────────┐        ┌─────────────────────────────┐
│   Android App (Local)   │        │    iOS App (Codemagic)      │
│   Build on Windows      │        │    Build on Cloud Mac       │
└─────────────────────────┘        └─────────────────────────────┘
              ↓                                    ↓
┌─────────────────────────┐        ┌─────────────────────────────┐
│    Google Play Store    │        │      Apple App Store        │
└─────────────────────────┘        └─────────────────────────────┘
```

## 🛠️ Prerequisites

### For Android (Local Build)

- [Android Studio](https://developer.android.com/studio) installed
- Java 17+ installed
- Android SDK (installed via Android Studio)
- Google Play Developer account ($25 one-time fee)

### For iOS (Cloud Build)

- [Codemagic](https://codemagic.io) account (free tier available)
- Apple Developer Program membership ($99/year)
- App Store Connect access

## 🚀 Quick Start

### 1. Initial Setup (One-time)

```bash
# Install dependencies (already done)
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# Build the web app
npm run build

# Add Android platform
npm run cap:add:android

# Sync Capacitor
npm run cap:sync
```

### 2. Build and Test Locally (Android)

```bash
# Build the web app and sync
npm run build:mobile

# Open in Android Studio
npm run cap:android

# In Android Studio:
# - Click "Run" to test on emulator
# - Click "Build > Generate Signed Bundle/APK" for release
```

### 3. Build iOS via Codemagic (Cloud)

1. Push your code to GitHub
2. Sign up at [codemagic.io](https://codemagic.io)
3. Connect your GitHub repository
4. Configure iOS code signing (see below)
5. Run a build

## 📋 Detailed Setup

### Android Setup

#### 1. Set Up Android Studio

1. Download and install [Android Studio](https://developer.android.com/studio)
2. During setup, install the Android SDK
3. After installation, open SDK Manager and install:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools
   - Android Emulator

#### 2. Create Signing Key

For Play Store, you need a signing key:

```bash
cd android/app

# Generate a keystore (keep this file safe!)
keytool -genkey -v -keystore expense-os-release.keystore \
  -alias expense-os \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

#### 3. Configure Signing

Create `android/keystore.properties`:

```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=expense-os
storeFile=expense-os-release.keystore
```

**⚠️ Never commit this file to git!**

Update `android/app/build.gradle` to use these properties.

#### 4. Build Release APK/AAB

```bash
cd android

# Build APK (for testing)
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

Find the output in:

- APK: `android/app/build/outputs/apk/release/`
- AAB: `android/app/build/outputs/bundle/release/`

### iOS Setup via Codemagic

Since you don't have a Mac, we use Codemagic's cloud Macs to build iOS.

#### 1. Create Codemagic Account

1. Go to [codemagic.io](https://codemagic.io)
2. Sign up with GitHub
3. Connect your repository

#### 2. Set Up Apple Developer Account

1. Go to [developer.apple.com](https://developer.apple.com)
2. Enroll in Apple Developer Program ($99/year)
3. Wait for approval (usually 24-48 hours)

#### 3. Create App Store Connect API Key

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Users and Access → Keys → App Store Connect API
3. Generate a new key with "App Manager" access
4. Download the .p8 file (you can only download once!)
5. Note the Key ID and Issuer ID

#### 4. Configure Codemagic

In Codemagic dashboard:

1. Go to your app → Settings → Environment variables
2. Add these variables in a group called `ios_credentials`:
   - `APP_STORE_CONNECT_KEY_IDENTIFIER`: Your Key ID
   - `APP_STORE_CONNECT_ISSUER_ID`: Your Issuer ID
   - `APP_STORE_CONNECT_PRIVATE_KEY`: Contents of .p8 file

3. Go to Code signing → iOS
4. Click "Fetch signing files" - Codemagic will auto-create certificates

#### 5. Create App in App Store Connect

1. Go to App Store Connect → My Apps → + → New App
2. Fill in:
   - Platform: iOS
   - Name: Expense.OS
   - Bundle ID: com.expenseos.app
   - SKU: expense-os-001

#### 6. Run iOS Build

1. In Codemagic, select "ios-release" workflow
2. Click "Start new build"
3. Wait for build (usually 15-20 minutes)
4. The IPA will be uploaded to TestFlight automatically

## 🔧 NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run build` | Build Next.js static export |
| `npm run build:mobile` | Build web + sync Capacitor |
| `npm run cap:sync` | Sync web → native projects |
| `npm run cap:android` | Open Android Studio |
| `npm run cap:ios` | Open Xcode (Mac only) |
| `npm run cap:add:android` | Add Android platform |
| `npm run cap:add:ios` | Add iOS platform |

## 📱 App Configuration

### Change App ID

Update `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.expenseos', // Change this
  appName: 'Expense.OS',
  // ...
};
```

Then update:

- `android/app/build.gradle` → `applicationId`
- `codemagic.yaml` → `BUNDLE_ID` and `PACKAGE_NAME`

### Change App Name

Update `capacitor.config.ts`:

```typescript
appName: 'Your App Name',
```

### Add App Icons

Place icons in:

- Android: `android/app/src/main/res/` (various sizes)
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Use a tool like [App Icon Generator](https://appicon.co/) to generate all sizes from a single 1024x1024 image.

### Configure Splash Screen

1. Install plugin:

```bash
npm install @capacitor/splash-screen
npx cap sync
```

1. Add images:

- Android: `android/app/src/main/res/drawable/splash.png`
- iOS: Configure in Xcode storyboard

## 🚨 Troubleshooting

### Build fails with "Static export not compatible"

Some Next.js features don't work with static export:

- Server Components in certain configurations
- API routes (won't be available in app)
- Image Optimization (disabled in config)

**Solution**: The offline-first architecture we built handles this - data comes from IndexedDB, not API routes!

### Android build fails

1. Check Java version: `java -version` (need 17+)
2. Update Android Studio and SDK
3. Clear Gradle cache: `cd android && ./gradlew clean`

### Codemagic iOS build fails

1. Check logs in Codemagic dashboard
2. Verify App Store Connect API key is correct
3. Ensure Bundle ID matches App Store Connect

### App crashes on startup

1. Check that `npm run build` succeeded
2. Verify `out/` directory has content
3. Run `npx cap sync` again

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Codemagic Documentation](https://docs.codemagic.io)
- [Play Store Publishing Guide](https://developer.android.com/distribute)
- [App Store Publishing Guide](https://developer.apple.com/app-store/submitting/)
