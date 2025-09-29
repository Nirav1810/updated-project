import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Snackbar, useTheme, FAB } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClassDetails, User, RootStackParamList } from '../types';
import { classes } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ClassDetails'>

const ClassDetailsScreen = ({ route }: Props) => {
  const { colors } = useTheme();
  const { classId } = route.params;

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchClassDetails = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const details = await classes.getById(classId);
      // Create a mock ClassDetails structure since the backend doesn't return populated fields
      const mockClassDetails: ClassDetails = {
        ...details,
        teacherId: {
          _id: details.teacherId,
          fullName: 'Teacher', // Placeholder
          email: 'teacher@example.com' // Placeholder
        },
        students: [] // Empty array for now
      };
      setClassDetails(mockClassDetails);
    } catch (err: any) {
      setError(err.message || 'Failed to load class details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassDetails();
  }, [fetchClassDetails]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !classDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Class details not found.'}</Text>
        <FAB
          icon="refresh"
          label="Try Again"
          onPress={fetchClassDetails}
          style={styles.fab} 
        />
      </View>
    );
  }

  const renderStudent = ({ item }: { item: User }) => (
    <Card style={styles.studentCard}>
      <Card.Content>
        <Text style={styles.studentName}>{item.fullName}</Text>
        <Text>Enrollment No: {item.enrollmentNo}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.title}>Class: {classDetails.classNumber}</Text>
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Text style={styles.detailText}>Teacher: {classDetails.teacherId ? classDetails.teacherId.fullName : 'N/A'}</Text>
        </Card.Content>
      </Card>
      <Text style={styles.sectionTitle}>Enrolled Students</Text>
      {classDetails.students.length > 0 ? (
        <FlatList
          data={classDetails.students}
          renderItem={renderStudent}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchClassDetails} />
          }
        />
      ) : (
        <Text style={styles.noDataText}>No students are enrolled in this class yet.</Text>
      )}      
      <FAB
        style={styles.floatingButton}
        icon="plus"
        label="Enroll Student"
        onPress={() => console.log('Enroll Student button pressed')}
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
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsCard: {
    marginBottom: 20,
    padding: 10,
  },
  detailText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  studentCard: {
    marginBottom: 10,
    padding: 5,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  floatingButton: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  fab: {
    marginTop: 20,
  }
});

export default ClassDetailsScreen;
