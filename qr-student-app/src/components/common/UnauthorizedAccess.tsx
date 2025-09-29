import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabParamList } from '../../types';

type NavProps = NativeStackScreenProps<TabParamList>;

interface Props {
    message?: string;
}

const UnauthorizedAccess: React.FC<Props> = ({ message = "You don't have permission to view this screen." }) => {
    const navigation = useNavigation<NavProps>();
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.message, { color: colors.error }]}>{message}</Text>
            <Button mode="contained" onPress={() => navigation.navigate('Home')}>
                Back to Home
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    message: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default UnauthorizedAccess;
