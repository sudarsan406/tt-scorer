import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from './contexts/DatabaseContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <DatabaseProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </DatabaseProvider>
  );
}
