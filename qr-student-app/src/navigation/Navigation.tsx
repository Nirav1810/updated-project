import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';

import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, TabParamList } from '../types';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import ClassesScreen from '../screens/ClassesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AttendanceManagementScreen from '../screens/AttendanceManagementScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ClassDetailsScreen from '../screens/ClassDetailsScreen';

// Import Components
import FullScreenLoader from '../components/FullScreenLoader';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// A map for tab icons to make the code cleaner and more scalable
const tabIconMap: Record<keyof TabParamList, 
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
    Home: { focused: 'home', unfocused: 'home-outline' },
    Scan: { focused: 'qr-code', unfocused: 'qr-code-outline' },
    Classes: { focused: 'book', unfocused: 'book-outline' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
    AttendanceManagement: { focused: 'checkbox', unfocused: 'checkbox-outline' },
};

const TabNavigator = () => {
  const { user } = useAuth();
  const theme = useTheme(); // Use the theme from PaperProvider

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIconMap[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: '#e0e0e0',
        },
      })} 
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {user?.role === 'student' && <Tab.Screen name="Scan" component={ScanScreen} />}
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen
        name="AttendanceManagement"
        component={AttendanceManagementScreen}
        initialParams={{ classId: '' }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // The loading check should only be here, at the top level.
  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ClassDetails" component={ClassDetailsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;