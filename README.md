# AegisDome

**AegisDome** is a Threat Intelligence Scanner and Secure Dashboard built to protect users from modern cyber threats, including zero-day phishing, malware, and sophisticated exploits. 

Powered by the global intelligence network of VirusTotal (aggregating over 90+ security vendors), AegisDome provides real-time, actionable insights on suspicious targets.

## Core Features

- **Threat Intelligence Scanner:** Enter any URL, domain, IP address, file hash, or upload binary files to receive a detailed, real-time breakdown of security posture across 90+ independent vendors.
- **Secure QR Scanner:** Built-in web camera function and image upload that parses physical QR codes, instantly extracts the hidden destination link, and processes it through the threat network.
- **Scam Radar:** Paste entire suspicious emails or raw text logs. AegisDome will automatically parse, extract, and deduplicate all hidden URLs, IPs, and hashes for 1-click scanning.
- **Intelligent Redirects & Warning Modals:** Clean URLs immediately redirect, while malicious URLs are hard-blocked by an un-bypassable warning modal showing exact threat intel.
- **Local SQLite Caching:** Implements a 24-hour persistent database layer (`better-sqlite3`) to instantly load previously scanned items without burning VirusTotal API credits.
- **High-Fidelity PDF Reports:** Generates vector-based PDF reports directly on any desktop or mobile device using `jsPDF` and `jspdf-autotable`. All content and tables are perfectly structured, automatically paginated, and fully copy-pasteable.

## Tech Stack

- **Frontend:** Next.js 16 (React 19), Tailwind CSS v4, Lucide Icons
- **Backend:** Next.js API Routes (Serverless)
- **Integrations:** VirusTotal API (v3), HTML5-QRCode

## 🚀 How to Share & Run on Any Device


### Option 1: For Windows Desktop (Local Run)
If you want to share the code with a friend who has a Windows PC, they can run it locally with one click:
1. Ensure they have [Node.js](https://nodejs.org) installed on their computer.
2. Send them this project folder.
3. Tell them to double-click the **`start-aegisdome.bat`** file.
4. The script will automatically install all requirements, start the secure backend server, and open AegisDome in their browser!

### Option 2: For Mobile Phones (The Best Method)
To use AegisDome on an iPhone or Android, you must deploy the "Brain" (the backend server) to the internet so your phone can connect to it. We recommend using **Vercel** (it is 100% free).

1. Upload this entire code repository to your GitHub account.
2. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
3. Click **Add New Project**, select your AegisDome repository, and click **Deploy**.
4. In the Vercel project settings, add your `VIRUSTOTAL_API_KEY` to the Environment Variables.
5. Vercel will give you a live URL (e.g., `https://aegisdome.vercel.app`).

**Installing the Mobile App:**
Now that it is on the internet, your friends can install it like a real app!
1. Open the Vercel URL on Safari (iPhone) or Chrome (Android).
2. Tap the Share button (iOS) or Menu button (Android).
3. Select **"Add to Home Screen"**.
4. AegisDome will be installed on their phone as a full-screen **Progressive Web App (PWA)**!

### Option 3: Package & Send App Files Directly (APK, EXE, APP)
If you want to package the app into a standalone file (e.g., an `.apk` for Android or a `.exe` for Windows) and share it directly with others (via WhatsApp, Telegram, USB, etc.), follow these packaging methods on **Kali Linux**:

#### A. Package for Desktop (Windows/macOS/Linux)
Using **Nativefier**, you can wrap the deployed Vercel web application into a native desktop launcher:
* **To build for Windows (`.exe`):**
  ```bash
  npx nativefier -p windows --name "AegisDome" --icon public/icon-512.png "https://your-vercel-link.vercel.app"
  ```
* **To build for Linux (Binary):**
  ```bash
  npx nativefier -p linux --name "AegisDome" --icon public/icon-512.png "https://your-vercel-link.vercel.app"
  ```
* **To build for macOS (`.app`):**
  ```bash
  npx nativefier -p osx --name "AegisDome" --icon public/icon-512.png "https://your-vercel-link.vercel.app"
  ```
*Zip the resulting build directory and send it directly to your friends!*

#### B. Package for Android (`.apk`)
To generate a native Android installer file that users can tap to install:
1. Install Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init AegisDome com.aegisdome.app --web-dir=out
   npx cap add android
   ```
2. Export your Next.js project and sync with the Android container:
   ```bash
   npm run build
   npx cap sync
   ```
3. Compile the `.apk` file using Android Studio or CLI:
   ```bash
   npx cap open android
   ```
   In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**. 
   *Send the compiled `.apk` file directly to any Android device to install it!*

> **Note on Free Deployments:** Because free cloud services are "serverless", the local SQLite database cache will occasionally reset. This is perfectly normal and does not break the app; it just means it will fetch fresh data from VirusTotal.

## Future Roadmap

- **Malware Sandbox Integration:** Future support for hooking into Cuckoo Sandbox or ANY.RUN for dynamic behavioral analysis of uploaded binaries.
- **Team Workspaces:** User authentication and RBAC to share scan history across SOC teams.

### *👤Creator*

N3k0sint

Cybersecurity student | Osint Analyst | CTI & Digital Forensics Enthusiast


## 📄 License

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**.

You are free to use, study, and modify this code for educational purposes. However, if you distribute any modifications, they must also be open-source under the same license.
