import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabParamList } from '../../types';

// Define the navigation prop type for better type safety
type HomeScreenNavigationProp = NativeStackScreenProps<TabParamList>;

const CommonButton = (props: React.ComponentProps<typeof Button>) => (
    <Button
        mode="contained"
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        {...props}
    />
);

export const StudentHomeContent = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    return (
        <>
            <Text style={styles.instructions}>To mark your attendance:</Text>
            <Text style={styles.step}>1. Navigate to the Scan tab.</Text>
            <Text style={styles.step}>2. Scan the QR code from your teacher.</Text>
            <Text style={styles.step}>3. Your attendance will be marked.</Text>
            <CommonButton onPress={() => navigation.navigate('Scan')}>
                Go to Scan
            </CommonButton>
        </>
    );
};

const styles = StyleSheet.create({
    instructions: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        marginTop: 24,
    },
    step: {
        fontSize: 16,
        marginBottom: 8,
        paddingLeft: 12,
    },
    button: {
        marginTop: 16,
        borderRadius: 8,
    },
    buttonContent: {
        paddingVertical: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
});
