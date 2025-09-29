import React from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Props {
    children: React.ReactNode;
    refreshing?: boolean;
    onRefresh?: () => void;
}

const ScreenContainer: React.FC<Props> = ({ children, refreshing, onRefresh }) => {
    const { colors } = useTheme();

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                onRefresh ? <RefreshControl refreshing={refreshing || false} 
                onRefresh={onRefresh} /> : undefined
            }
        >
            {children}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 40,
    },
});

export default ScreenContainer;
