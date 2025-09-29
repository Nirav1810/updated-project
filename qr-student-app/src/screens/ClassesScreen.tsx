import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, Pressable } from 'react-native';
import { Text, Card, ActivityIndicator, Snackbar, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { classes } from '../services/api';
import { Class, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClassDetails'>;

// A simplified, pressable card for students
const StudentClassCard = ({ classItem, onNavigate }: { classItem: Class; onNavigate: () => void; }) => {
  return (
    <Pressable onPress={onNavigate}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.subjectName}>{classItem.subjectName}</Text>
          <Text style={styles.cardText}>Code: {classItem.subjectCode}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.cardText}>Year: {classItem.classYear}</Text>
            <Text style={styles.cardText}>Semester: {classItem.semester}</Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
};

const ClassesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [classList, setClassList] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEnrolledClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Use the new student-specific endpoint
      const response = await classes.getAll();
      setClassList(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchEnrolledClasses();
      }
    }, [user, fetchEnrolledClasses])
  );

  const renderItem = ({ item }: { item: Class }) => (
    <StudentClassCard 
      classItem={item}
      // Navigate to a details screen, passing the classId
      onNavigate={() => navigation.navigate('ClassDetails', { classId: item._id })}
    />
  );

  if (loading && classList.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Loading Your Classes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={classList}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.title}>My Enrolled Classes</Text>}
        ListEmptyComponent={
          <View style={styles.loader}>
            <Text style={styles.noData}>You are not enrolled in any classes yet.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchEnrolledClasses} tintColor={colors.primary} />
        }
      />
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={4000}
        style={{ backgroundColor: colors.error }}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    opacity: 0.8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noData: {
    fontSize: 16,
    textAlign: 'center',
    color: '#777',
  },
});

export default ClassesScreen;