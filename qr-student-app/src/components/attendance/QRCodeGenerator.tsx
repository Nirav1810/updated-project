import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { qr } from '../../services/api';
import * as Location from 'expo-location';

interface QRCodeGeneratorProps {
    classId: string;
    onSuccess: (token: string) => void;
    onError: (message: string) => void;
    loading: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ classId, onSuccess, onError, loading }) => {
    const { user } = useAuth();
    const [scheduleId, setScheduleId] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateQR = async () => {
        if (!classId || !scheduleId) {
            onError('Class ID and Schedule ID are required.');
            return;
        }
        setIsGenerating(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Location permission denied');
            }
            const location = await Location.getCurrentPositionAsync({});
            const response = await qr.generate({
                classId,
                scheduleId,
                teacherId: user!._id,
                coordinates: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
            });
            onSuccess(`QR Code generated: ${response.token}`);
        } catch (err: any) {
            onError(err.message || 'Failed to generate QR code');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.subTitle}>QR Code Generator</Text>
            <TextInput
                label="Schedule ID"
                value={scheduleId}
                onChangeText={setScheduleId}
                mode="outlined"
                style={styles.input}
                disabled={loading || isGenerating}
                theme={{ roundness: 8 }}
            />
            <Button
                mode="contained"
                onPress={handleGenerateQR}
                loading={isGenerating}
                disabled={loading || isGenerating || !classId || !scheduleId}
                style={styles.button}
            >
                Generate QR Code
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
});

export default QRCodeGenerator;
