# SquareUp - Expense Splitting App

A mobile expense splitting app built with React Native and Firebase, similar to Splitwise.

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Install iOS dependencies: `cd ios && pod install && cd ..`
4. Add Firebase configuration files (see Firebase Setup section)
5. Run on iOS: `npm run ios`
6. Run on Android: `npm run android`

## Tech Stack

- React Native with TypeScript
- Firebase (Auth, Firestore, Storage)
- Zustand (State Management)
- React Navigation
- React Native Paper

## Project Structure

See [Project Structure Documentation](./docs/PROJECT_STRUCTURE.md)

## Firebase Setup

1. Create Firebase project at console.firebase.google.com
2. Add iOS and Android apps to your Firebase project
3. Download configuration files:
   - `google-services.json` for Android (place in `android/app/`)
   - `GoogleService-Info.plist` for iOS (place in `ios/squareup/`)
4. Enable Authentication (Email/Password), Firestore, and Storage in Firebase console

## Development

- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm start` - Start Metro bundler
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript compiler
- `npm test` - Run tests

## Features

- User authentication
- Create and manage groups
- Add and split expenses
- Track balances
- Settle debts

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. For iOS (macOS only), install CocoaPods dependencies:
   ```bash
   cd ios && pod install && cd ..
   ```

3. Start the Metro bundler:
   ```bash
   npm start
   ```

4. Run the app:
   ```bash
   # For iOS
   npm run ios

   # For Android
   npm run android
   ```

## Project Status

Phase 1 (Project Setup) - ✅ Complete
- Development environment configured
- All dependencies installed
- Project structure established
- TypeScript and ESLint configured

## License

Private project for personal use.
