import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeDisplayProps {
    token: string;
    onRefresh: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ token, onRefresh }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Live QR Code</Text>
            <Card style={styles.card}>
                <Card.Content style={styles.content}>
                    <QRCode
                        value={token}
                        size={200}
                        backgroundColor="white"
                        color="#6200ea" 
                    />
                    <Text style={styles.tokenText}>Token: {token.slice(0, 10)}...</Text>
                    <Text style={styles.infoText}>This code is live. Students can scan it now.</Text>
                    <Button
                        mode="contained"
                        onPress={onRefresh}
                        style={styles.button}
                    >
                        Hide QR Code
                    </Button>
                </Card.Content>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#1a1a1a',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 4,
        width: '100%',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 24,
    },
    tokenText: {
        marginTop: 16,
        fontSize: 14,
        color: '#555',
    },
    infoText: {
        marginTop: 8,
        fontSize: 12,
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'center',
    },
    button: {
        marginTop: 20,
        backgroundColor: '#6200ea',
        borderRadius: 8,
    },
});

export default QRCodeDisplay;
