const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_RECEIVERS = [
  {
    name: '.widget.DailyRingsWidgetProvider',
    resource: '@xml/daily_rings_widget_info',
  },
  {
    name: '.widget.NextSalahWidgetProvider',
    resource: '@xml/next_salah_widget_info',
  },
  {
    name: '.widget.CircleProgressWidgetProvider',
    resource: '@xml/circle_progress_widget_info',
  },
  {
    name: '.widget.CombinedWidgetProvider',
    resource: '@xml/combined_widget_info',
  },
];

/**
 * Copy widget resources and source files from targets/android-widget to android/
 */
const withWidgetFiles = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, 'android');
      const widgetSource = path.join(projectRoot, 'targets', 'android-widget');

      console.log('[android-widgets] Copying widget files...');
      console.log('[android-widgets] Widget source:', widgetSource);
      console.log('[android-widgets] Android root:', androidRoot);

      // Copy resource files
      const resSource = path.join(widgetSource, 'res');
      const resDest = path.join(androidRoot, 'app', 'src', 'main', 'res');

      if (fs.existsSync(resSource)) {
        console.log('[android-widgets] Copying resources from', resSource, 'to', resDest);
        copyRecursive(resSource, resDest);
        console.log('[android-widgets] Resources copied successfully');
      } else {
        console.warn('[android-widgets] Resource source not found:', resSource);
      }

      // Copy Kotlin source files
      const srcSource = path.join(widgetSource, 'src');
      const srcDest = path.join(androidRoot, 'app', 'src', 'main', 'java');

      if (fs.existsSync(srcSource)) {
        console.log('[android-widgets] Copying source files from', srcSource, 'to', srcDest);
        copyRecursive(srcSource, srcDest);
        console.log('[android-widgets] Source files copied successfully');
      } else {
        console.warn('[android-widgets] Source source not found:', srcSource);
      }

      return config;
    },
  ]);
};

/**
 * Recursively copy directory contents
 */
function copyRecursive(source, dest) {
  if (!fs.existsSync(source)) return;

  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(source);
    for (const entry of entries) {
      const srcPath = path.join(source, entry);
      const destPath = path.join(dest, entry);
      copyRecursive(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(source, dest);
  }
}

/**
 * Add widget receiver entries to AndroidManifest.xml
 */
const withWidgetManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    if (!manifest.manifest.application) {
      manifest.manifest.application = [];
    }

    const application = manifest.manifest.application[0];

    if (!application.receiver) {
      application.receiver = [];
    }

    // Add widget receivers
    for (const widget of WIDGET_RECEIVERS) {
      // Check if receiver already exists
      const exists = application.receiver.some(
        (r) => r.$ && r.$['android:name'] === widget.name
      );

      if (!exists) {
        application.receiver.push({
          $: {
            'android:name': widget.name,
            'android:exported': 'true',
          },
          'intent-filter': [
            {
              action: [
                {
                  $: {
                    'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                  },
                },
              ],
            },
          ],
          'meta-data': [
            {
              $: {
                'android:name': 'android.appwidget.provider',
                'android:resource': widget.resource,
              },
            },
          ],
        });
      }
    }

    return config;
  });
};

/**
 * Add WidgetPackage import and registration to MainApplication.kt
 */
const withWidgetPackage = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // Add import if not present
    const importStatement = 'import com.my.AJR.android.widget.WidgetPackage';
    if (!contents.includes(importStatement)) {
      // Find a good place to add import (after expo imports)
      const importMatch = contents.match(/import expo\.modules\.ReactNativeHostWrapper/);
      if (importMatch) {
        contents = contents.replace(
          importMatch[0],
          `${importMatch[0]}\n${importStatement}`
        );
      }
    }

    // Add WidgetPackage to packages if not present
    if (!contents.includes('add(WidgetPackage())')) {
      // Find PackageList section
      const packageListMatch = contents.match(
        /PackageList\(this\)\.packages\.apply\s*\{[^}]*\}/
      );
      if (packageListMatch) {
        const originalSection = packageListMatch[0];
        const newSection = originalSection.replace(
          /\{/,
          `{\n              // Widget package for Android home screen widgets\n              add(WidgetPackage())`
        );
        contents = contents.replace(originalSection, newSection);
      }
    }

    config.modResults.contents = contents;
    return config;
  });
};

/**
 * Main plugin function
 */
const withAndroidWidgets = (config) => {
  config = withWidgetFiles(config);
  config = withWidgetManifest(config);
  config = withWidgetPackage(config);
  return config;
};

module.exports = withAndroidWidgets;
