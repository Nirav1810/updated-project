import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, List, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { TabParamList } from '../types';
import { StudentHomeContent } from '../components/home/RoleSpecificContent';
import ScreenContainer from '../components/common/ScreenContainer';

type Props = NativeStackScreenProps<TabParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Add any student-specific data fetching here in the future.
    setTimeout(() => setRefreshing(false), 1000); // Simulate network request
  }, []);

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>Welcome back,</Text>
        <Text style={styles.welcomeName}>{user?.fullName || 'Student'}!</Text>
      </View>

      {/* Student Quick Actions  */}
      <Card style={styles.card}>
        <Card.Content>
          <Text>Quick Actions</Text>
          <List.Item
            title="Mark Attendance"
            description="Scan a QR code to join a class"
            left={() => <List.Icon icon="qrcode-scan" />}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => navigation.navigate('Scan')} // Navigate to Scan Tab
            style={styles.listItem}
          />
          <List.Item
            title="View My Classes"
            description="See your enrolled subjects and schedules"
            left={() => <List.Icon icon="google-classroom" />}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => navigation.navigate('Classes')} // Navigate to Classes Tab
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Main Student Content Area  */}
      <Card style={styles.card}>
        <Card.Content>
          {/* The StudentHomeContent component will render here directly  */}
          <StudentHomeContent />
        </Card.Content>
      </Card>
    </ScreenContainer>

  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '300',
  },
  welcomeName: {
    fontSize: 32,
    fontWeight: '700',
  },
  card: {
    marginBottom: 16,
  },
  listItem: {
    paddingHorizontal: 0,
  },
});

export default HomeScreen;