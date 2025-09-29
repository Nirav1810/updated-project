// import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
// import { Asset } from 'expo-asset';
// import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
// import * as FileSystem from 'expo-file-system';
// import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
// import { Worklets } from 'react-native-worklets-core';

// let model: TensorflowModel | null = null;

// export const initTFLite = async () => {
//   if (model) return;
//   try {
//     const asset = await Asset.fromModule(require('../../assets/models/mobilefacenet.tflite')).downloadAsync();
//     model = await loadTensorflowModel({ url: asset.localUri! });
//     console.log('TFLite model loaded successfully');
//   } catch (err) {
//     console.error('Failed to load TFLite model:', err);
//     throw new Error('Failed to initialize TFLite model');
//   }
// };

// export const getFaceEmbedding = async (imagePath: string, face?: Face): Promise<number[]> => {
//   if (!model) throw new Error('TFLite model not initialized');

//   let imageUri = imagePath;
//   if (face) {
//     // Crop face based on detected boundingBox
//     const {  } = face;
//     const manipResult = await manipulateAsync(
//       imagePath,
//       [
//         {
//           crop: {
//             originX: boundingBox.left,
//             originY: boundingBox.top,
//             width: boundingBox.width,
//             height: boundingBox.height,
//           },
//         },
//         { resize: { width: 112, height: 112 } },
//         { flip: FlipType.Horizontal }, // Mirror for front camera
//       ],
//       { format: SaveFormat.JPEG, compress: 0.8 }
//     );
//     imageUri = manipResult.uri;
//   } else {
//     // Resize to 112x112
//     const manipResult = await manipulateAsync(
//       imagePath,
//       [{ resize: { width: 112, height: 112 } }, { flip: FlipType.Horizontal }],
//       { format: SaveFormat.JPEG, compress: 0.8 }
//     );
//     imageUri = manipResult.uri;
//   }

//   const tensor = await imageToTensor(imageUri);
//   const embedding = await model.run([tensor]);
//   return Array.from(embedding[0] as Float32Array); // Convert TypedArray to number[]
// };

// export const imageToTensor = async (imageUri: string): Promise<Float32Array> => {
//   // Read image file
//   const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });

//   // Process pixels in a worklet
//   const pixels = await Worklets.runOnJS(() => {
//     'worklet';
//     // Decode base64 to Uint8Array
//     const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

//     // Create tensor: 112x112x3, normalized to [0,1]
//     const tensor = new Float32Array(112 * 112 * 3);
//     const pixelCount = Math.min(imageBytes.length, tensor.length);
//     for (let i = 0; i < pixelCount; i += 3) {
//       tensor[i] = imageBytes[i] / 255.0; // R
//       tensor[i + 1] = (i + 1 < pixelCount ? imageBytes[i + 1] : 0) / 255.0; // G
//       tensor[i + 2] = (i + 2 < pixelCount ? imageBytes[i + 2] : 0) / 255.0; // B
//     }
//     return tensor;
//   });

//   return pixels;
// };

// export const useFaceDetection = () => {
//   return async (imagePath: string): Promise<Face[]> => {
//     try {
//       const faces = await FaceDetection.detect(imagePath);
//       return faces || [];
//     } catch (err) {
//       console.error('Face detection failed:', err);
//       return [];
//     }
//   };
// };