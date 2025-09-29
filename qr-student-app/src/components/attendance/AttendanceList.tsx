import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme } from 'react-native-paper';
import { Attendance } from '../../types';

interface AttendanceListProps {
    records: Attendance[];
    loading: boolean;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ records, loading }) => {
    const { colors } = useTheme();
    
    if (loading) {
        return <ActivityIndicator animating={true} size="large" style={styles.loader} />;
    }
    
    if (records.length === 0) {
        return <Text style={styles.noData}>No attendance records found</Text>;
    }
    
    return (
        <View style={styles.container}>
        {records.map((record) => (
            <Card key={record._id} style={styles.card}>
                <Card.Content>
                    <Text style={styles.recordTitle}>Student: {record.studentId.fullName}</Text>
                    <Text>Status: {record.status}</Text>
                    <Text>Date: {new Date(record.attendedAt).toLocaleDateString()}</Text>
                    <Text>Manual: {record.manualEntry ? 'Yes' : 'No'}</Text>
                </Card.Content>
            </Card>
        ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20,
    },
    loader: {
        marginTop: 20,
    },
    noData: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        color: '#1a1a1a',
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2,
    },
    recordTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1a1a1a',
    },
});

export default AttendanceList;