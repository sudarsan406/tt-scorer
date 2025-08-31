# 🏓 TT Score - Table Tennis Scoring App

A comprehensive React Native table tennis scoring application built with Expo, featuring tournament management, real-time scoring, and detailed statistics tracking.

## ✨ Features

### 🎮 Core Functionality
- **Quick Match Creation** - Start singles or doubles matches instantly
- **Real-time Scoring** - Live score updates with set tracking
- **Tournament Management** - Single elimination and round robin tournaments
- **Player Statistics** - Comprehensive analytics and performance tracking
- **Bracket Visualization** - Interactive tournament brackets

### 📊 Analytics & Statistics
- Win/loss ratios and percentages
- Set performance tracking
- Current winning/losing streaks
- Historical match data
- Trending statistics over time periods (7d, 30d, 3m, 6m, 1y)
- Overall system statistics

### 🎯 Platform Support
- **iOS** - Native iOS app with custom icons
- **Android** - Native Android app with adaptive icons
- **Web** - Browser-based version with favicon

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tt-score

# Install dependencies
npm install

# Start the development server
npm start
```

### Development Commands

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run web version
npm run web
```

## 📱 App Structure

### Navigation
- **Home** - Quick actions and recent activity
- **Matches** - Match history and management
- **Players** - Player profiles and statistics
- **Tournaments** - Tournament creation and management
- **Statistics** - Comprehensive analytics dashboard

### Database Schema
The app uses SQLite for local data persistence with the following key entities:
- **Players** - User profiles with ratings and statistics
- **Matches** - Individual match records with scores
- **Tournaments** - Tournament metadata and participant tracking
- **Tournament Matches** - Bracket structure and advancement logic

## 🔧 Configuration

### App Settings
- **Bundle ID**: `com.ttscoreapp.ttscore`
- **App Name**: TT Score
- **Supported Orientations**: Portrait
- **Minimum iOS**: 11.0
- **Target SDK**: Android 33

### EAS Build Configuration
The app includes EAS (Expo Application Services) configuration for:
- **Development builds** - For testing with development client
- **Preview builds** - For internal testing
- **Production builds** - For app store deployment

## 🎨 Design & Branding

### Visual Identity
- **Primary Color**: #2196F3 (Blue)
- **Theme**: Clean, modern table tennis aesthetic
- **Icons**: Custom ping pong themed icons (1024x1024)
- **Typography**: System fonts for optimal readability

### Icon Assets
- `icon.png` - Main app icon (1024x1024)
- `adaptive-icon.png` - Android adaptive icon
- `splash-icon.png` - Splash screen image
- `favicon.png` - Web favicon (32x32)

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React Native with TypeScript
- **Navigation**: React Navigation 7
- **Database**: SQLite with expo-sqlite
- **State Management**: React Hooks + Context API
- **Build System**: Expo SDK 53
- **Development**: Expo Dev Client

### Key Components
- **DatabaseService** - SQLite operations and data management
- **BracketGenerator** - Tournament bracket creation and management
- **Statistics Engine** - Performance analytics and trending data
- **Navigation System** - Tab and stack navigation structure

## 🔒 Security & Data

### Data Storage
- **Local Storage**: SQLite database for offline functionality
- **Data Persistence**: All match and tournament data stored locally
- **Privacy**: No external data transmission in current version

### Security Features
- Secure UUID generation for all entities
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## 🚧 Development Roadmap

### Phase 1: Core Features ✅
- [x] Match creation and scoring
- [x] Player management
- [x] Tournament brackets
- [x] Statistics tracking
- [x] Custom branding and icons

### Phase 2: Enhanced Features (Planned)
- [ ] Cloud synchronization
- [ ] Multi-device support
- [ ] User authentication
- [ ] Team management
- [ ] Push notifications

### Phase 3: Advanced Features (Future)
- [ ] Social features
- [ ] Achievement system
- [ ] Video highlights
- [ ] Professional tournament formats
- [ ] Data export/import

## 📄 License

Private project - All rights reserved.

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the development team.

## 📞 Support

For technical support or feature requests, please open an issue in the repository.

---

**Built with ❤️ for table tennis enthusiasts**
