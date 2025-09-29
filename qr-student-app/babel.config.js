module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Required for react-native-reanimated worklets
            [
                'react-native-reanimated/plugin',
                {
                    globals: ['__scanFaces'], // Add scanFaces for vision-camera-face-detector
                },
            ],
        ],
    };
};