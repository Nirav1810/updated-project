import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, RadioButton } from 'react-native-paper';

interface AttendanceFiltersProps {
    filters: { startDate: string; endDate: string; status: string };
    onFilterChange: (filters: { startDate: string; endDate: string; status: string }) => void;
    disabled: boolean;
}

const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({ filters, onFilterChange, disabled }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Filters</Text>
            <TextInput
                label="Start Date (YYYY-MM-DD)"
                value={filters.startDate}
                onChangeText={(text) => onFilterChange({ ...filters, startDate: text })}
                mode="outlined"
                style={styles.input}
                disabled={disabled}
                theme={{ roundness: 8 }}
            />
            <TextInput
                label="End Date (YYYY-MM-DD)"
                value={filters.endDate}
                onChangeText={(text) => onFilterChange({ ...filters, endDate: text })}
                mode="outlined"
                style={styles.input}
                disabled={disabled}
                theme={{ roundness: 8 }}
            />
            <Text style={styles.subTitle}>Status</Text>
            <RadioButton.Group
                onValueChange={(value) => onFilterChange({ ...filters, status: value })}
                value={filters.status}
            >
                <View style={styles.radioOption}>
                    <RadioButton value="" disabled={disabled} />
                    <Text style={styles.radioText}>All</Text>
                </View>
                <View style={styles.radioOption}>
                    <RadioButton value="present" disabled={disabled} />
                    <Text style={styles.radioText}>Present</Text>
                </View>
                <View style={styles.radioOption}>
                    <RadioButton value="late" disabled={disabled} />
                    <Text style={styles.radioText}>Late</Text>
                </View>
                <View style={styles.radioOption}>
                    <RadioButton value="absent" disabled={disabled} />
                    <Text style={styles.radioText}>Absent</Text>
                </View>
            </RadioButton.Group>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#1a1a1a',
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#1a1a1a',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    radioText: {
        fontSize: 14,
        color: '#1a1a1a',
    },
});

export default AttendanceFilters;
