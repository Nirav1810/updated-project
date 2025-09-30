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
import FaceLivenessScreen from '../screens/FaceLivenessScreen'; // Import the new screen

// Import Components
import FullScreenLoader from '../components/FullScreenLoader';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const tabIconMap: Record<keyof TabParamList, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Scan: { focused: 'qr-code', unfocused: 'qr-code-outline' },
  Classes: { focused: 'school', unfocused: 'school-outline' },
  Profile: { focused: 'person-circle', unfocused: 'person-circle-outline' },
  AttendanceManagement: { focused: 'file-tray-full', unfocused: 'file-tray-outline' },
};

const TabNavigator = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? tabIconMap[route.name].focused : tabIconMap[route.name].unfocused;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      })} 
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {user?.role === 'student' && <Tab.Screen name="Scan" component={ScanScreen} />}
      <Tab.Screen name="Classes" component={ClassesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {user?.role === 'teacher' && (
        <Tab.Screen
          name="AttendanceManagement"
          component={AttendanceManagementScreen}
          initialParams={{ classId: '' }}
        />
      )}
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="ClassDetails" component={ClassDetailsScreen} />
            {/* Add FaceLivenessScreen here, without header for a full-screen experience */}
            <Stack.Screen 
              name="FaceLiveness" 
              component={FaceLivenessScreen} 
            />
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