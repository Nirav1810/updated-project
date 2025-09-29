import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, RadioButton, Button, Menu } from 'react-native-paper';
import { attendance } from '../../services/api';

interface ManualAttendanceFormProps {
    classId: string;
    students: { _id: string; fullName: string }[];
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
    loading: boolean;
}

const ManualAttendanceForm: React.FC<ManualAttendanceFormProps> = ({
    classId,
    students,
    onSuccess,
    onError,
    loading
}) => {
    const [studentId, setStudentId] = useState('');
    const [scheduleId, setScheduleId] = useState('');
    const [manualStatus, setManualStatus] = useState<'present' | 'late' | 'absent'>('present');
    const [studentMenuVisible, setStudentMenuVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleManualAttendance = async () => {
        if (!studentId || !scheduleId || !classId) {
            onError('Student ID, Schedule ID, and Class ID are required');
            return;
        }
        setIsSubmitting(true);
        try {
            await attendance.manual({
                studentId,
                classId,
                scheduleId,
                status: manualStatus,
                attendedAt: new Date().toISOString(),
            });
            onSuccess('Manual attendance submitted successfully');
            setStudentId('');
            setScheduleId('');
        } catch (err: any) {
            onError(err.message || 'Failed to submit manual attendance');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.formContainer}>
            <Text style={styles.subTitle}>Manual Attendance</Text>
            <Menu
                visible={studentMenuVisible}
                onDismiss={() => setStudentMenuVisible(false)}
                anchor={
                    <Button
                        mode="outlined"
                        onPress={() => setStudentMenuVisible(true)}
                        style={styles.button}
                        disabled={loading || isSubmitting}
                    >
                        {students.find((s) => s._id === studentId)?.fullName || 'Select Student'}
                    </Button>
                }
            >
                {students.map((student) => (
                    <Menu.Item
                        key={student._id}
                        onPress={() => {
                            setStudentId(student._id);
                            setStudentMenuVisible(false);
                        }}
                        title={student.fullName}
                    />
                ))}
            </Menu>
            <TextInput
                label="Schedule ID"
                value={scheduleId}
                onChangeText={setScheduleId}
                mode="outlined"
                style={styles.input}
                disabled={loading || isSubmitting}
                theme={{ roundness: 8 }}
            />
            <Text style={styles.subTitle}>Status</Text>
            <RadioButton.Group
                onValueChange={(value) => setManualStatus(value as 'present' | 'late' | 'absent')}
                value={manualStatus}
            >
                <View style={styles.radioOption}>
                    <RadioButton value="present" disabled={loading || isSubmitting} />
                    <Text style={styles.radioText}>Present</Text>
                </View>
                <View style={styles.radioOption}>
                    <RadioButton value="late" disabled={loading || isSubmitting} />
                    <Text style={styles.radioText}>Late</Text>
                </View>
                <View style={styles.radioOption}>
                    <RadioButton value="absent" disabled={loading || isSubmitting} />
                    <Text style={styles.radioText}>Absent</Text>
                </View>
            </RadioButton.Group>
            <Button
                mode="contained"
                onPress={handleManualAttendance}
                loading={isSubmitting}
                disabled={loading || isSubmitting || !studentId || !scheduleId || !classId }
                style={styles.button}
            >
                Submit Manual Attendance
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: {
        marginBottom: 20,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1a1a1a',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 12,
        backgroundColor: '#6200ea',
        borderRadius: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    radioText: {
        fontSize: 14,
        color: '#1a1a1a',
    },
});

export default ManualAttendanceForm;
