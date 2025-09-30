import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Snackbar, RadioButton, ActivityIndicator, ProgressBar, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import AuthContainer from '../components/Auth/AuthContainer';
import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const { register } = useAuth();
  const { colors } = useTheme();

  // State for form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [classYear, setClassYear] = useState('');
  const [semester, setSemester] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [faceImageUri, setFaceImageUri] = useState<string | null>(null);

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1. Info, 2. Face Capture
  const cameraRef = useRef<CameraView>(null);

  // State for Camera Permissions
  const [permission, requestPermission] = useCameraPermissions();

  const handleCaptureFace = async () => {
    if (!cameraRef.current) {
      setError('Camera not ready.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: true,
      });
      
      if (photo && photo.uri) {
        // Store the photo URI for later upload
        setFaceImageUri(photo.uri);
        
        // Create a mock embedding for validation (real embedding will be created on server)
        console.log('Face captured successfully, preparing for upload...');
        const mockEmbedding = Array.from({ length: 128 }, () => Math.random());
        setFaceEmbedding(mockEmbedding);
        setSuccess('Face captured successfully! Proceed to register.');
      } else {
        throw new Error('Failed to capture photo');
      }
    } catch (err: any) {
      setError('Failed to capture face. Please try again.');
      console.log('Face capture error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    // Basic validation
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (role === 'student') {
      if (!enrollmentNo) {
        setError('Enrollment number is required for students.');
        return;
      }
      if (!classYear || !['1', '2', '3', '4'].includes(classYear)) {
        setError('Please enter a valid class year (1-4).');
        return;
      }
      if (!semester || !['1', '2', '3', '4', '5', '6', '7', '8'].includes(semester)) {
        setError('Please enter a valid semester (1-8).');
        return;
      }
      if (!faceEmbedding || !faceImageUri) {
        setError('Face capture is required for student registration.');
        return;
      }
    }

    setLoading(true);
    try {
      let faceImageBase64 = null;
      
      // Convert face image to base64 if captured
      if (faceImageUri) {
        console.log('Converting face image to base64...');
        const base64 = await FileSystem.readAsStringAsync(faceImageUri, {
          encoding: 'base64',
        });
        faceImageBase64 = `data:image/jpeg;base64,${base64}`;
        console.log('Face image converted to base64, size:', base64.length);
      }

      await register({
        fullName,
        email,
        password,
        role,
        enrollmentNo: enrollmentNo || undefined,
        classYear: classYear || undefined,
        semester: semester || undefined,
        faceImageBase64: faceImageBase64 || undefined,
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigation.replace('Login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Permission Request Screen
  if (!permission) {
    return <ActivityIndicator style={styles.centered} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={styles.permissionText}>We need camera access for face registration for students.</Text>
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 20 }}>
          Grant Permission
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()}>
          Back to Login
        </Button>
      </View>
    );
  }

  // Multi-step form rendering
  const renderStepOne = () => (
    <>
      <Text style={styles.stepTitle}>Step 1 of 2: Your Details</Text>
      <TextInput 
        label="Full Name" 
        value={fullName} 
        onChangeText={setFullName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />
      
      <Text style={styles.roleLabel}>Select your role:</Text>
      <RadioButton.Group onValueChange={(v) => setRole(v as any)} value={role}>
        <View style={styles.radioOption}>
          <RadioButton value="student" />
          <Text>Student</Text>
        </View>
        <View style={styles.radioOption}>
          <RadioButton value="teacher" />
          <Text>Teacher</Text>
        </View>
      </RadioButton.Group>

      {role === 'student' && (
        <>
          <TextInput
            label="Enrollment No. (Required)"
            value={enrollmentNo}
            onChangeText={setEnrollmentNo}
            autoCapitalize="characters"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Class Year (1-4)"
            value={classYear}
            onChangeText={setClassYear}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            placeholder="Enter your current year (1, 2, 3, or 4)"
          />
          <TextInput
            label="Semester (1-8)"
            value={semester}
            onChangeText={setSemester}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            placeholder="Enter your current semester (1-8)"
          />
        </>
      )}
      <Button
        mode="contained"
        onPress={() => setStep(2)}
        loading={loading || !fullName || !email || !password || (role === 'student' && (!enrollmentNo || !classYear || !semester))}
        style={styles.button}
      >
        Continue
      </Button>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text style={styles.stepTitle}>Step 2 of 2: Face Recognition</Text>
      <Text style={styles.guidanceText}>
        Please align your face within the camera view below and tap 'Capture'.
      </Text>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
      </View>
      <Button 
        icon={faceEmbedding ? 'check-circle' : 'camera'} 
        mode="outlined" 
        onPress={handleCaptureFace} 
        disabled={loading || !!faceEmbedding}
        style={styles.button}
      >
        {faceEmbedding ? 'Face Captured' : 'Capture Face'}
      </Button>
      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading || !faceEmbedding}
        style={styles.button}
      >
        Register
      </Button>
    </>
  );

  return (
    <AuthContainer title="Create Account">
      <ProgressBar progress={step / 2} color={colors.primary} style={styles.progressBar} />
      {step === 1 ? renderStepOne() : renderStepTwo()}
      <Button
        mode="text"
        onPress={() => step > 1 ? setStep(1) : navigation.navigate('Login')}
        disabled={loading}
      >
        {step > 1 ? 'Go Back' : 'Already have an account? Login'}
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
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  guidanceText: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#666'
  },
  progressBar: {
    width: '100%',
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
});

export default RegisterScreen;