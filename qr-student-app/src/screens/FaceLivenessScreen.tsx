import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTheme, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { attendance } from '../services/api';
import { RootStackParamList } from '../types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getBase64SizeKB, isImageSizeAcceptable } from '../utils/imageUtils';
import * as ImageManipulator from 'expo-image-manipulator';

type Props = NativeStackScreenProps<RootStackParamList, 'FaceLiveness'>;

const { width: screenWidth } = Dimensions.get('window');

const FaceLivenessScreen = ({ route }: Props) => {
  const { sessionId, classId } = route.params;
  const navigation = useNavigation();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Position your face in the frame and tap Capture');
  const [permission, requestPermission] = useCameraPermissions();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (!permission?.granted) {
        const cameraResult = await requestPermission();
        if (!cameraResult.granted) {
          Alert.alert('Permission Required', 'Camera permission is required for face verification.');
          navigation.goBack();
          return;
        }
      }
      
      const locationResult = await Location.requestForegroundPermissionsAsync();
      if (!locationResult.granted) {
        Alert.alert('Permission Required', 'Location permission is required for attendance verification.');
        navigation.goBack();
      }
    };

    requestPermissions();
  }, [permission, requestPermission, navigation]);

  const captureAndSubmit = async () => {
    if (!cameraRef.current || isLoading) return;

    setIsLoading(true);
    setMessage('Capturing photo...');

    try {
      // Wait a moment for camera to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let photo = await cameraRef.current.takePictureAsync({
        quality: 0.1,  // Start with very low quality
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        throw new Error('Failed to capture photo');
      }

      // Implement progressive resizing and compression
      setMessage('Optimizing image...');
      
      let manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { resize: { width: 800 } }, // Resize to max width of 800px
        ],
        {
          compress: 0.3,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      let currentSizeKB = getBase64SizeKB(manipulatedImage.base64!);
      console.log(`Image size after initial resize (800px): ${currentSizeKB}KB`);

      // If still too large, try smaller sizes
      if (currentSizeKB > 400) {
        setMessage('Further compressing...');
        manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            { resize: { width: 600 } }, // Smaller resize
          ],
          {
            compress: 0.2,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        currentSizeKB = getBase64SizeKB(manipulatedImage.base64!);
        console.log(`Image size after 600px resize: ${currentSizeKB}KB`);
      }

      // Final attempt with very small size if still too large
      if (currentSizeKB > 400) {
        setMessage('Final compression...');
        manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            { resize: { width: 400 } }, // Very small
          ],
          {
            compress: 0.1,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        currentSizeKB = getBase64SizeKB(manipulatedImage.base64!);
        console.log(`Image size after 400px resize: ${currentSizeKB}KB`);
      }

      // Use the manipulated image
      if (!manipulatedImage.base64) {
        throw new Error('Failed to process image');
      }
      
      photo.base64 = manipulatedImage.base64;

      setMessage('Getting location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setMessage('Verifying with AWS Rekognition...');
      
      // Final size check before sending
      console.log(`Final image size: ${currentSizeKB}KB`);
      
      if (!isImageSizeAcceptable(photo.base64, 500)) {
        throw new Error(`Image still too large (${currentSizeKB}KB). Using smallest possible size.`);
      }
      
      const base64Image = `data:image/jpeg;base64,${photo.base64}`;
      
      await attendance.submit({
        sessionId,
        classId,
        studentCoordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        livenessPassed: true,
        faceImage: base64Image,
      });

      setIsSuccess(true);
      setMessage('Face verified successfully! Attendance marked.');
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigation.goBack();
      }, 2000);

    } catch (error: any) {
      console.error('Face verification error:', error);
      
      let errorMessage = 'Verification failed. Please try again.';
      
      if (error.response?.status === 413 || error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage = 'Image too large. Please try again - the photo will be automatically compressed.';
      } else if (error.message?.includes('Face recognition failed')) {
        errorMessage = 'Face not recognized. Please ensure your face is clearly visible.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message?.includes('Location')) {
        errorMessage = 'Location error. Please ensure location services are enabled.';
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        errorMessage = 'Request error. Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
      setMessage('Position your face in the frame and tap Capture');
      setIsLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.messageText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={80} color={colors.error} />
        <Text style={styles.messageText}>Camera permission required</Text>
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 20 }}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          active={isFocused && !isLoading && !isSuccess}
        />
        
        {/* Face oval overlay */}
        <View style={styles.overlay}>
          <View style={styles.faceOval} />
        </View>
      </View>

      {/* Bottom UI */}
      <View style={styles.bottomContainer}>
        {/* Status Icon */}
        <View style={styles.statusContainer}>
          {isLoading && <ActivityIndicator size="large" color={colors.primary} />}
          {isSuccess && (
            <MaterialCommunityIcons name="check-circle" size={60} color="#4CAF50" />
          )}
        </View>

        {/* Message */}
        <Text style={styles.messageText}>{message}</Text>

        {/* Capture Button */}
        {!isLoading && !isSuccess && (
          <Button
            mode="contained"
            onPress={captureAndSubmit}
            style={styles.captureButton}
            contentStyle={styles.captureButtonContent}
          >
            Capture & Verify
          </Button>
        )}

        {/* Back Button */}
        {!isLoading && (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Back
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOval: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.9,
    borderRadius: (screenWidth * 0.7) / 2,
    borderWidth: 3,
    borderColor: '#FFF',
    backgroundColor: 'transparent',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  statusContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '500',
  },
  captureButton: {
    marginTop: 15,
    width: '80%',
  },
  captureButtonContent: {
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 10,
    width: '60%',
  },
});

export default FaceLivenessScreen;