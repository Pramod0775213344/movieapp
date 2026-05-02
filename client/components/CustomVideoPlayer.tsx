import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Play, Pause, RotateCcw, RotateCw, ChevronLeft, Maximize, Minimize } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CustomVideoPlayerProps {
    videoUrl: string;
    title: string;
    onBack: () => void;
}

export default function CustomVideoPlayer({ videoUrl, title, onBack }: CustomVideoPlayerProps) {
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(true); // Always starts fullscreen
    const controlsOpacity = useSharedValue(1);
    const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Lock to landscape on mount
        const lockOrientation = async () => {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        };
        lockOrientation();

        startHideTimer();

        return () => {
            // Revert to portrait on unmount
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        };
    }, []);

    const startHideTimer = () => {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        hideControlsTimer.current = setTimeout(() => {
            hideControls();
        }, 4000);
    };

    const toggleControls = () => {
        if (showControls) {
            hideControls();
        } else {
            showControlsUI();
        }
    };

    const showControlsUI = () => {
        setShowControls(true);
        controlsOpacity.value = withTiming(1, { duration: 300 });
        startHideTimer();
    };

    const hideControls = () => {
        controlsOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
            if (finished) runOnJS(setShowControls)(false);
        });
    };

    const handlePlayPause = async () => {
        startHideTimer();
        if (!videoRef.current) return;
        if (status.isPlaying) {
            await videoRef.current.pauseAsync();
        } else {
            await videoRef.current.playAsync();
        }
    };

    const skipForward = async () => {
        startHideTimer();
        if (!videoRef.current || !status.positionMillis) return;
        await videoRef.current.setPositionAsync(status.positionMillis + 10000);
    };

    const skipBackward = async () => {
        startHideTimer();
        if (!videoRef.current || !status.positionMillis) return;
        await videoRef.current.setPositionAsync(Math.max(0, status.positionMillis - 10000));
    };

    const handleSeek = async (value: number) => {
        startHideTimer();
        if (!videoRef.current || !status.durationMillis) return;
        await videoRef.current.setPositionAsync(value * status.durationMillis);
    };

    const formatTime = (millis: number) => {
        if (!millis || isNaN(millis)) return '00:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const animatedControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: showControls ? 10 : -1,
    }));

    return (
        <View style={styles.container}>
            <Pressable style={styles.videoWrapper} onPress={toggleControls}>
                <Video
                    ref={videoRef}
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    resizeMode={ResizeMode.CONTAIN}
                    onPlaybackStatusUpdate={(s) => setStatus(() => s)}
                    shouldPlay
                />
            </Pressable>

            {/* Overlay Controls */}
            <Animated.View style={[styles.controlsOverlay, animatedControlsStyle]} pointerEvents={showControls ? 'auto' : 'none'}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <Pressable onPress={onBack} style={styles.iconButton}>
                        <ChevronLeft color="#fff" size={32} />
                    </Pressable>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <View style={{ width: 32 }} /> {/* Placeholder for balance */}
                </View>

                {/* Center Controls */}
                <View style={styles.centerControls}>
                    <Pressable onPress={skipBackward} style={styles.centerButton}>
                        <RotateCcw color="#fff" size={40} />
                        <Text style={styles.skipText}>10</Text>
                    </Pressable>
                    
                    {status.isBuffering ? (
                        <ActivityIndicator size="large" color="#E50914" />
                    ) : (
                        <Pressable onPress={handlePlayPause} style={[styles.centerButton, styles.playButton]}>
                            {status.isPlaying ? <Pause color="#fff" size={48} /> : <Play color="#fff" size={48} />}
                        </Pressable>
                    )}

                    <Pressable onPress={skipForward} style={styles.centerButton}>
                        <RotateCw color="#fff" size={40} />
                        <Text style={styles.skipText}>10</Text>
                    </Pressable>
                </View>

                {/* Bottom Bar */}
                <View style={styles.bottomBar}>
                    <Text style={styles.timeText}>{formatTime(status.positionMillis)}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={1}
                        value={status.durationMillis ? status.positionMillis / status.durationMillis : 0}
                        onSlidingComplete={handleSeek}
                        onValueChange={startHideTimer}
                        minimumTrackTintColor="#E50914"
                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                        thumbTintColor="#E50914"
                    />
                    <Text style={styles.timeText}>{formatTime(status.durationMillis)}</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    controlsOverlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between',
        padding: 20,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    iconButton: {
        padding: 10,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        maxWidth: '70%',
        textAlign: 'center',
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 50,
    },
    centerButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    skipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    slider: {
        flex: 1,
        height: 40,
        marginHorizontal: 15,
    },
    timeText: {
        color: '#fff',
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    },
});
