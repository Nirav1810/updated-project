import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Button, Snackbar, Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import AuthContainer from '../components/Auth/AuthContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [identifier, setIdentifier] = useState(''); // Use one field for email or enrollment
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { colors } = useTheme();

  const handleLogin = async () => {
    setError('');
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Determine if the identifier is an email or enrollment number
      const isEmail = identifier.includes('@');
      const loginData = {
        email: isEmail ? identifier : undefined,
        enrollmentNo: !isEmail ? identifier : undefined,
        password,
      };

      await login(loginData);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer title="Welcome Back">
      <TextInput
        label="Enrollment No. or Email"
        value={identifier}
        onChangeText={setIdentifier}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        disabled={loading}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={loading}
      />
      <View style={styles.forgotPasswordContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={{ color: colors.primary }}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Login
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('Register')}
        disabled={loading}
        style={styles.textButton}
      >
        Don't have an account? Register
      </Button>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={4000}
        style={{ backgroundColor: colors.error }}
      >
        {error}
      </Snackbar>
    </AuthContainer>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
  },
  buttonContent: {
    height: 40,
  },
  textButton: {
    marginTop: 12,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
});

export default LoginScreen;