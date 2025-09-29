import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, Button, Snackbar, Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import AuthContainer from '../components/Auth/AuthContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = ({ navigation }: Props) => {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { forgotPassword } = useAuth();
    const { colors } = useTheme();

    const handleForgotPassword = async () => {
      setError('');
      setSuccess('');
      if (!identifier) {
        setError('Please enter your email or enrollment number.');
        return;
      }

      setLoading(true);
      try {
        const isEmail = identifier.includes('@');
        const forgotData = {
            email: isEmail ? identifier : undefined,
            enrollmentNo: !isEmail ? identifier : undefined,
        };
        await forgotPassword(forgotData);
        setSuccess('If an account exists, a password reset link has been sent to your email.');
      } catch (err: any) {
        setError(err.message || 'Failed to send password reset request.')
      } finally {
        setLoading(false);
      }
    };

    return (
        <AuthContainer title="Forgot Password?">
            <Text style={styles.guidanceText}>
                Enter your email or enrollment number below to receive a password reset link.
            </Text>
            <TextInput
                label="Enrollment No. or Email"
                value={identifier}
                onChangeText={setIdentifier}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                disabled={loading}
            />
            <Button
                mode="contained"
                onPress={handleForgotPassword}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
            >
                Send Reset Link
            </Button>
            <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
            >
                Back to Login
            </Button>
            <Snackbar
                visible={!!error}
                onDismiss={() => setError('')}
                duration={4000}
                style={{ backgroundColor: colors.error }}
            >
                {error}
            </Snackbar>
            <Snackbar
                visible={!!success}
                onDismiss={() => setSuccess('')}
                duration={4000}
                style={{ backgroundColor: 'green' }}
            >
                {success}
            </Snackbar>
        </AuthContainer>
    );
}

const styles = StyleSheet.create({
    guidanceText: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 16,
        paddingVertical: 4
    },
    buttonContent: {
        height: 40,
    },
});

export default ForgotPasswordScreen;
