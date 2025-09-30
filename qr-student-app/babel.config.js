module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Required for react-native-worklets
            [
                'react-native-worklets/plugin',
                {
                    globals: ['__scanFaces'], // Add scanFaces for vision-camera-face-detector
                },
            ],
        ],
    };
};