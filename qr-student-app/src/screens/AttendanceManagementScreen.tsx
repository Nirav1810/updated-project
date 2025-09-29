import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, Snackbar, useTheme, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { attendance, classes, users } from '../services/api';
import { TabParamList, Attendance, Class } from '../types';
import ScreenContainer from '../components/common/ScreenContainer';
import UnauthorizedAccess from '../components/common/UnauthorizedAccess';
import ClassSelector from '../components/attendance/ClassSelector';
import AttendanceFilters from '../components/attendance/AttendanceFilters';
import AttendanceStats from '../components/attendance/AttendanceStats';
import ManualAttendanceForm from '../components/attendance/ManualAttendanceForm';
import QRCodeGenerator from '../components/attendance/QRCodeGenerator';
import AttendanceList from '../components/attendance/AttendanceList';
import QRCodeDisplay from '../components/attendance/QRCodeDisplay';

type Props = NativeStackScreenProps<TabParamList, 'AttendanceManagement'>;

const useAttendance = (classId: string, filters: any) => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    if (!classId) {
      setRecords([]);
      setStats({ total: 0, present: 0, late: 0, absent: 0 });
      setLoading(false);
      return;
    };
    setLoading(true);
    setError('');
    try {
      const response = await attendance.getByClass(classId, filters);
      setRecords(response.attendance);
      setStats(response.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [classId, filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { records, stats, loading, error, refetch: fetch };
}

const AttendanceManagementScreen = ({ route }: Props) => {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [selectedClassId, setSelectedClassId] = useState(route.params?.classId || '');
  const [classesData, setClassesData] = useState<Class[]>([]);
  const [studentsData, setStudentsData] = useState<{ _id: string; fullName: string }[]>([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', status: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { records, stats, loading, refetch } = useAttendance(selectedClassId, filters);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [studentResponse, classesResponse] = await Promise.all([
          users.getAll(),
          classes.getAll(),
        ]);
        setStudentsData(studentResponse);
        setClassesData(classesResponse);
        if (!selectedClassId && classesResponse.length > 0) {
          setSelectedClassId(classesResponse[0]._id);
        }
      } catch (err) {
        setErrorMessage('Failed to load initial data.');
      }
    };
    if (user?.role === 'teacher' || user?.role === 'admin') {
      fetchInitialData();
    }
  }, [user?.role, selectedClassId]);

  const handleManualAction = (message: string) => {
    setSuccessMessage(message);
    refetch(); // Refetch data after a successful manual action
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
  }
  
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return <UnauthorizedAccess />;
  }

  return (
    <ScreenContainer onRefresh={refetch} refreshing={loading}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Attendance Management</Text>
        {isInitialLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <>
            <ClassSelector
              classes={classesData}
              selectedClassId={selectedClassId}
              onSelectedClass={setSelectedClassId}
              disabled={loading}
            />
            <AttendanceFilters
              filters={filters}
              onFilterChange={setFilters}
              disabled={loading} 
            />
            <AttendanceStats stats={stats} />
            <ManualAttendanceForm 
              classId={selectedClassId}
              students={studentsData}
              onSuccess={handleManualAction}
              onError={handleError}
              loading={loading}
            />
            <QRCodeGenerator 
              classId={selectedClassId}
              onSuccess={(token) => {
                setQrCodeData(token);
                setSuccessMessage('QR Code generated successfully!');
              }}
              onError={handleError}
              loading={loading}
            />
            {qrCodeData && (
              <QRCodeDisplay
                token={qrCodeData}
                onRefresh={() => setQrCodeData(null)}
              />
            )}
            <Text style={styles.sectionTitle}>Attendance Records</Text>
            <AttendanceList records={records} loading={loading} />
          </>
        )}
      </ScrollView>
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage('')}
        duration={4000}
        style={{ backgroundColor: colors.error }}
      >
        {errorMessage}
      </Snackbar>
      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage('')}
        duration={4000}
        style={{ backgroundColor: colors.primary }}
      >
        {successMessage}
      </Snackbar>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 16,
    color: '#1a1a1a',
  },
  loader: {
    marginTop: 20,
  },
});

export default AttendanceManagementScreen;