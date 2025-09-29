import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Snackbar, useTheme, Avatar, List } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import ScreenContainer from '../components/common/ScreenContainer';

// We need the RootStackParamList type for navigation to ChangePasswordScreen
type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen = ({ navigation }: Props) => {
  const { user, logout, isLoading } = useAuth();
  const { colors } = useTheme();
  const [error, setError] = useState('');

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
    } catch (err: any) {
      setError(err.message || 'Failed to log out');
    }
  };

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Avatar.Text size={80} label={getInitials(user?.fullName)} />
          <Text style={styles.title}>{user?.fullName}</Text>
          <Text style={styles.role}>Student</Text>
        </View>

        <List.Section style={styles.listSection}>
          <List.Subheader>Student Information</List.Subheader>
          <List.Item
            title="Enrollment No."
            description={user?.enrollmentNo || 'N/A'}
            left={() => <List.Icon icon="account-outline" />}
          />
          <List.Item
            title="Email"
            description={user?.email || 'N/A'}
            left={() => <List.Icon icon="email-outline" />}
          />
        </List.Section>

        <List.Section style={styles.listSection}>
          <List.Subheader>Settings</List.Subheader>
          <List.Item
            title="Change Password"
            description="Update your account security"
            left={() => <List.Icon icon="lock-outline" />}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </List.Section>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            loading={isLoading}
            disabled={isLoading}
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            icon="logout-variant"
            contentStyle={styles.buttonContent}
          >
            Logout
          </Button>
        </View>
      </View>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={4000}
        style={{ backgroundColor: colors.error }}
      >
        {error}
      </Snackbar>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  role: {
    fontSize: 16,
    textTransform: 'capitalize',
    color: '#757575',
    marginTop: 4,
  },
  listSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  logoutButton: {
    paddingVertical: 4,
  },
  buttonContent: {
    height: 40,
  }
});

export default ProfileScreen;