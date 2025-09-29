import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation/Navigation';
import ErrorBoundary from './src/components/ErrorBoundary';
import { theme } from './src/styles/theme';

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <ErrorBoundary>
        <AuthProvider>
          <Navigation />
          <StatusBar style="auto" />
        </AuthProvider>
      </ErrorBoundary>
    </PaperProvider>
  );
}