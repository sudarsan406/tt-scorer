# TT Scorer iOS App Store Deployment Guide

## ✅ Completed Steps

1. **Updated app icon**: Changed to use `tt-scorer-icon.png` throughout the application
2. **Updated app version**: Bumped to version 1.0.1 for release  
3. **EAS configuration**: Already configured for production iOS builds
4. **Apple credentials**: Already configured with `sudarsan406@gmail.com`
5. **App Store Connect**: App ID `6752398902` already configured

## 🔧 Next Steps (Manual Actions Required)

### Step 1: Set up Apple Credentials Interactively
Since interactive prompts are required, you'll need to run this command in your terminal:

```bash
npx eas build --platform ios --profile production
```

When prompted:
- **Apple Account**: Log in with `sudarsan406@gmail.com`
- **Distribution Certificate**: Let EAS generate or use existing
- **Provisioning Profile**: Let EAS generate for App Store distribution

### Step 2: Complete the Production Build
After credentials are set up, the build will proceed automatically and:
- Build your app for iOS App Store distribution
- Generate an `.ipa` file ready for submission
- Upload to EAS servers for download

### Step 3: Submit to App Store Connect
Once build completes, submit to App Store:

```bash
npx eas submit --platform ios --profile production
```

This will:
- Upload your `.ipa` to App Store Connect
- Use your configured Apple ID: `sudarsan406@gmail.com`
- Use your App Store Connect App ID: `6752398902`

## 📱 App Configuration Summary

- **App Name**: TT Scorer
- **Bundle ID**: com.skanagala.ttscorer
- **Version**: 1.0.1
- **Icon**: tt-scorer-icon.png (updated ✅)
- **Apple ID**: sudarsan406@gmail.com
- **App Store Connect ID**: 6752398902

## 🎯 App Store Requirements Met

✅ **App Icon**: Using tt-scorer-icon.png (1024x1024px recommended)
✅ **Version Number**: 1.0.1
✅ **Bundle Identifier**: com.skanagala.ttscorer
✅ **App Store Connect**: Already configured
✅ **EAS Configuration**: Production profile ready
✅ **Encryption Exemption**: Configured

## 🚀 Commands to Run

1. **Build for App Store**:
   ```bash
   npx eas build --platform ios --profile production
   ```

2. **Submit to App Store**:
   ```bash
   npx eas submit --platform ios --profile production
   ```

3. **Check build status**:
   ```bash
   npx eas build:list
   ```

## 📋 App Store Connect Next Steps

After submission, you'll need to:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your TT Scorer app
3. Add app metadata (description, keywords, screenshots)
4. Submit for App Store review
5. Wait for Apple's approval (typically 24-48 hours)

## 🔍 Troubleshooting

If you encounter issues:
- Make sure you're logged into EAS: `npx eas whoami` ✅ (logged in as sudarsan406)
- Check build logs: `npx eas build:list`
- Verify Apple Developer account status
- Ensure all app icons are the correct size

Your app is now ready for iOS App Store deployment! 🎉

## 📝 Notes
- The buildNumber field was removed from app.json as recommended by EAS
- Version source is set to "remote" in eas.json configuration
- All necessary iOS configuration is in place