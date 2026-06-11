# GitHub Pages Setup Guide for AJR Update Config

This is a one-time setup. After this, you control updates by editing a single JSON file on GitHub's website — no coding needed.

---

## Step 1 — Create the GitHub Repo

1. Go to [github.com](https://github.com) and sign in
2. Click **"New"** (the green button at the top left)
3. Repository name: `ajr-config`
4. Set it to **Public** (required for GitHub Pages free hosting)
5. Check **"Add a README file"**
6. Click **"Create repository"**

---

## Step 2 — Create the Config File

1. In your new repo, click **"Add file"** → **"Create new file"**
2. Name it exactly: `config.json`
3. Paste this content (replace `<YOUR_IOS_APP_ID>` with your real App Store numeric ID):

```json
{
  "hardUpdate": {
    "enabled": false,
    "title": "Update Required",
    "message": "A critical update is available. Please update the app to continue using AJR.",
    "androidUrl": "https://play.google.com/store/apps/details?id=com.my.AJR.android",
    "iosUrl": "https://apps.apple.com/app/id<YOUR_IOS_APP_ID>"
  },
  "softUpdate": {
    "enabled": false,
    "title": "New Update Available",
    "message": "We've added new features to enhance your spiritual journey. Update now!",
    "androidUrl": "https://play.google.com/store/apps/details?id=com.my.AJR.android",
    "iosUrl": "https://apps.apple.com/app/id<YOUR_IOS_APP_ID>"
  }
}
```

4. Click **"Commit changes"** (bottom of page)

---

## Step 3 — Enable GitHub Pages

1. In your repo, go to **Settings** tab
2. Scroll down to **"Pages"** in the left sidebar
3. Under **"Source"**, select **"Deploy from a branch"**
4. Branch: `main`, Folder: `/ (root)`
5. Click **Save**

Wait ~1 minute. Your config will be live at:
```
https://YOUR_GITHUB_USERNAME.github.io/ajr-config/config.json
```

---

## Step 4 — Connect App to Your URL

Open `src/update-screens/UpdateService.js` and update line 30:

```js
const REMOTE_CONFIG_URL =
    'https://YOUR_GITHUB_USERNAME.github.io/ajr-config/config.json';
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

---

## How to Trigger an Update (After Setup)

1. Go to your `ajr-config` repo on GitHub
2. Click `config.json`
3. Click the **pencil ✏️ edit icon**
4. Change `"enabled": false` to `"enabled": true`
5. Click **"Commit changes"**
6. Within ~60 seconds, the app will show the update screen to all users

### Hard Update (forced):
```json
"hardUpdate": { "enabled": true, ... }
```
→ Full-screen gate, user **cannot dismiss**, must update.

### Soft Update (optional nudge):
```json
"softUpdate": { "enabled": true, ... }
```
→ Slide-up modal, user **can dismiss** and continue using the app.

### Turn off update:
Set `"enabled": false` and commit — update screen disappears immediately.

---

## Finding Your iOS App Store ID

1. Open the App Store on your iPhone
2. Find your AJR app → tap **Share** → **Copy Link**
3. The link looks like: `https://apps.apple.com/app/id123456789`
4. The number after `id` is your App ID — paste it into both JSON fields

