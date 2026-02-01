/**
 * Mobile Build Script
 * 
 * This script builds the app for Capacitor (mobile) by:
 * 1. Temporarily moving API routes out of the way
 * 2. Running the static export build
 * 3. Restoring the API routes
 * 
 * Usage: node scripts/build-mobile.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'app', 'api');
const API_BACKUP = path.join(__dirname, '..', '.api-backup');
const AUTH_DIR = path.join(__dirname, '..', 'app', 'auth');
const AUTH_BACKUP = path.join(__dirname, '..', '.auth-backup');
const MIDDLEWARE_FILE = path.join(__dirname, '..', 'middleware.ts');
const MIDDLEWARE_BACKUP = path.join(__dirname, '..', '.middleware-backup.ts');

// Helper to copy directory recursively
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Helper to delete directory recursively
function deleteDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

console.log('🚀 Starting mobile build...\n');

try {
    // Step 1: Backup API routes (copy, don't move)
    console.log('📦 Backing up server-only files...');
    if (fs.existsSync(API_DIR)) {
        deleteDir(API_BACKUP);
        copyDir(API_DIR, API_BACKUP);
        deleteDir(API_DIR);
        if (fs.existsSync(API_DIR)) throw new Error('Failed to delete app/api directory');
        console.log('   ✅ API routes backed up');
    }

    // Step 1b: Backup auth folder (uses dynamic server features)
    if (fs.existsSync(AUTH_DIR)) {
        deleteDir(AUTH_BACKUP);
        copyDir(AUTH_DIR, AUTH_BACKUP);
        deleteDir(AUTH_DIR);
        if (fs.existsSync(AUTH_DIR)) throw new Error('Failed to delete app/auth directory');
        console.log('   ✅ Auth folder backed up');
    }

    // Step 2: Backup middleware
    if (fs.existsSync(MIDDLEWARE_FILE)) {
        fs.copyFileSync(MIDDLEWARE_FILE, MIDDLEWARE_BACKUP);
        fs.unlinkSync(MIDDLEWARE_FILE);
        console.log('   ✅ Middleware backed up');
    }

    // Step 2b: Backup Server Actions (incompatible with static export)
    const ACTIONS_DIR = path.join(__dirname, '..', '_actions');
    const ACTIONS_BACKUP = path.join(__dirname, '..', '.actions-backup');
    if (fs.existsSync(ACTIONS_DIR)) {
        deleteDir(ACTIONS_BACKUP);
        copyDir(ACTIONS_DIR, ACTIONS_BACKUP);
        deleteDir(ACTIONS_DIR);
        if (fs.existsSync(ACTIONS_DIR)) throw new Error('Failed to delete _actions directory');
        console.log('   ✅ Server Actions backed up');
    }

    // Step 3: Remove 'force-dynamic' exports from pages & patch components using Server Actions
    const DYNAMIC_PAGES = [
        path.join(__dirname, '..', 'app', 'login', 'page.tsx'),
        path.join(__dirname, '..', 'app', 'dashboard', 'page.tsx'),
    ];
    // Also patch create-budget-wizard to remove server actions import
    const WIZARD_COMPONENT = path.join(__dirname, '..', 'components', 'budget', 'create-budget-wizard.tsx');

    const DYNAMIC_PAGES_BACKUP = path.join(__dirname, '..', '.dynamic-pages-backup');

    console.log('\n🔧 Patching pages for static export...');
    fs.mkdirSync(DYNAMIC_PAGES_BACKUP, { recursive: true });

    for (const pagePath of DYNAMIC_PAGES) {
        if (fs.existsSync(pagePath)) {
            const content = fs.readFileSync(pagePath, 'utf8');
            const fileName = path.basename(pagePath);
            const dirName = path.basename(path.dirname(pagePath));

            // Backup original
            fs.writeFileSync(path.join(DYNAMIC_PAGES_BACKUP, `${dirName}_${fileName}`), content);

            // Comment out the force-dynamic export
            const patched = content.replace(
                /export const dynamic = ['"]force-dynamic['"];?/g,
                "// Removed for static export: export const dynamic = 'force-dynamic';"
            );
            fs.writeFileSync(pagePath, patched);
            console.log(`   ✅ Patched ${dirName}/page.tsx`);
        }
    }

    // Patch create-budget-wizard.tsx
    if (fs.existsSync(WIZARD_COMPONENT)) {
        const content = fs.readFileSync(WIZARD_COMPONENT, 'utf8');
        const fileName = path.basename(WIZARD_COMPONENT);

        // Backup original
        fs.writeFileSync(path.join(DYNAMIC_PAGES_BACKUP, fileName), content);

        // Replace imports and mock functions
        let patched = content.replace(
            /import { saveBudget, getBudgetForEditing, BudgetRow } from '@\/_actions\/budget\/actions';/g,
            "// Mocked for mobile build\nconst saveBudget = async (rows: any) => {};\nconst getBudgetForEditing = async () => [];\ntype BudgetRow = any;"
        );
        fs.writeFileSync(WIZARD_COMPONENT, patched);
        console.log(`   ✅ Patched components/budget/${fileName}`);
    }

    // Step 4: Set environment and build
    console.log('\n🔨 Building static export...');
    console.log('   Environment: MOBILE_BUILD=true (static export enabled)');

    try {
        execSync('npx next build > mobile-build.log 2>&1', {
            env: { ...process.env, MOBILE_BUILD: 'true' }
        });
    } catch (e) {
        // Build failed
        throw new Error('Next.js build failed. Check mobile-build.log for details.');
    }

    // Verify the build created the out directory
    const outDir = path.join(__dirname, '..', 'out');
    if (!fs.existsSync(outDir)) {
        throw new Error('Static export failed - "out" directory was not created. Check mobile-build.log for errors.');
    }
    console.log('   ✅ Build complete - static files in /out');

    // Step 5: Sync with Capacitor
    console.log('\n📱 Syncing with Capacitor...');
    try {
        execSync('npx cap sync', { stdio: 'inherit' });
        console.log('   ✅ Capacitor synced');
    } catch (syncError) {
        console.log('   ⚠️ Capacitor sync skipped (platforms may not be added yet)');
        console.log('   Run "npm run cap:add:android" to add Android platform');
    }

} catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exitCode = 1; // Mark failure
} finally {
    // Always restore backups
    console.log('\n🔄 Restoring original files...');

    if (fs.existsSync(API_BACKUP)) {
        deleteDir(API_DIR);
        copyDir(API_BACKUP, API_DIR);
        deleteDir(API_BACKUP);
        console.log('   ✅ API routes restored');
    }

    if (fs.existsSync(AUTH_BACKUP)) {
        deleteDir(AUTH_DIR);
        copyDir(AUTH_BACKUP, AUTH_DIR);
        deleteDir(AUTH_BACKUP);
        console.log('   ✅ Auth folder restored');
    }

    // Restore ACTIONS
    const ACTIONS_DIR = path.join(__dirname, '..', '_actions');
    const ACTIONS_BACKUP = path.join(__dirname, '..', '.actions-backup');
    if (fs.existsSync(ACTIONS_BACKUP)) {
        deleteDir(ACTIONS_DIR);
        copyDir(ACTIONS_BACKUP, ACTIONS_DIR);
        deleteDir(ACTIONS_BACKUP);
        console.log('   ✅ Server Actions restored');
    }

    if (fs.existsSync(MIDDLEWARE_BACKUP)) {
        if (fs.existsSync(MIDDLEWARE_FILE)) {
            fs.unlinkSync(MIDDLEWARE_FILE);
        }
        fs.copyFileSync(MIDDLEWARE_BACKUP, MIDDLEWARE_FILE);
        fs.unlinkSync(MIDDLEWARE_BACKUP);
        console.log('   ✅ Middleware restored');
    }

    // Restore patched dynamic pages AND components
    const DYNAMIC_PAGES_BACKUP = path.join(__dirname, '..', '.dynamic-pages-backup');
    if (fs.existsSync(DYNAMIC_PAGES_BACKUP)) {
        const backupFiles = fs.readdirSync(DYNAMIC_PAGES_BACKUP);
        for (const backupFile of backupFiles) {
            // Check for page backups
            const match = backupFile.match(/^(.+)_(page\.tsx)$/);
            if (match) {
                const [, dirName, fileName] = match;
                const originalPath = path.join(__dirname, '..', 'app', dirName, fileName);
                const backupPath = path.join(DYNAMIC_PAGES_BACKUP, backupFile);
                fs.copyFileSync(backupPath, originalPath);
            } else if (backupFile === 'create-budget-wizard.tsx') {
                // Restore wizard component
                const originalPath = path.join(__dirname, '..', 'components', 'budget', 'create-budget-wizard.tsx');
                const backupPath = path.join(DYNAMIC_PAGES_BACKUP, backupFile);
                fs.copyFileSync(backupPath, originalPath);
            }
        }
        deleteDir(DYNAMIC_PAGES_BACKUP);
        console.log('   ✅ Dynamic pages & components restored');
    }
}

console.log('\n✅ Mobile build complete!');
console.log('\nNext steps:');
console.log('  • Android: npm run cap:android (opens Android Studio)');
console.log('  • iOS: Push to GitHub, build via Codemagic');
