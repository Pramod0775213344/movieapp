import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SectionHeader = ({ title }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginVertical: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    }
});

export default SectionHeader;
