import React from 'react';
import { StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface AuthContainerProps {
    title: string;
    children: React.ReactNode;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ title, children }) => {
    const { colors } = useTheme();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.flex, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Image
                    source={require('../../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain" 
                />
                <Text style={[styles.title, { color: colors.tertiary }]}>{title}</Text>
                {children}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 30,
    },
});

export default AuthContainer;
