import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';
import { Class } from '../../types';

interface ClassSelectorProps {
    classes: Class[];
    selectedClassId: string;
    onSelectedClass: (classId: string) => void;
    disabled: boolean;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({ classes, selectedClassId, onSelectedClass, disabled }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const selectedClass = classes.find((c) => c._id === selectedClassId);

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Select Class</Text>
            <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                    <Button
                        mode="contained"
                        onPress={() => setMenuVisible(true)}
                        style={styles.button}
                        disabled={disabled}
                    >
                        {selectedClass?.classNumber || 'Select Class'}
                    </Button>
                }
            >
                {classes.map((cls) => (
                    <Menu.Item
                        key={cls._id}
                        onPress={() => {
                            onSelectedClass(cls._id);
                            setMenuVisible(false);
                        }}
                        title={cls.classNumber}
                    />
                ))}
            </Menu>
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
    button: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 4,
    },
});

export default ClassSelector;
