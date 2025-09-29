import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card } from 'react-native-paper';

interface AttendanceStatsProps {
    stats: {
        total: number;
        present: number;
        late: number;
        absent: number;
    };
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ stats }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <Card style={styles.card}>
                <Card.Content>
                    <Text>Total: {stats.total}</Text>
                    <Text>Present: {stats.present}</Text>
                    <Text>Late: {stats.late}</Text>
                    <Text>Absent: {stats.absent}</Text>
                </Card.Content>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#1a1a1a',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
    },
});

export default AttendanceStats;
