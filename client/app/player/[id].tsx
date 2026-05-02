import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';

export default function PlayerScreen() {
    const router = useRouter();
    const { videoPath, title } = useLocalSearchParams();

    const handleBack = () => {
        router.back();
    };

    if (!videoPath) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff' }}>No video source available for this title.</Text>
                <Text style={{ color: '#E50914', marginTop: 20 }} onPress={handleBack}>Go Back</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Hide status bar for immersive experience */}
            <StatusBar hidden />
            <CustomVideoPlayer 
                videoUrl={videoPath as string} 
                title={title as string || 'Video Player'} 
                onBack={handleBack} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
});
