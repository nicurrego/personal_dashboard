import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.expenseos.app',
    appName: 'Kibo',
    webDir: 'out',

    // Server configuration for development
    // Comment out for production builds
    // server: {
    //   url: 'http://192.168.1.x:3000',
    //   cleartext: true
    // },

    // Android specific configuration
    android: {
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: false, // Set to true for debugging
    },

    // iOS specific configuration  
    ios: {
        contentInset: 'automatic',
        preferredContentMode: 'mobile',
        scheme: 'Kibo',
    },

    // Plugins configuration
    plugins: {
        // SplashScreen configuration
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#0a0a0a',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            splashFullScreen: true,
            splashImmersive: true,
        },

        // Status bar configuration
        StatusBar: {
            style: 'dark',
            backgroundColor: '#0a0a0a',
        },

        // Keyboard configuration
        Keyboard: {
            resize: 'body',
            style: 'dark',
            resizeOnFullScreen: true,
        },
    },
};

export default config;
