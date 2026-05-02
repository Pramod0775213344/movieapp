import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Play, Pause, RotateCcw, RotateCw, ChevronLeft } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

interface CustomVideoPlayerProps {
    videoUrl: string;
    title: string;
    onBack: () => void;
}

export default function CustomVideoPlayer({ videoUrl, title, onBack }: CustomVideoPlayerProps) {
    const player = useVideoPlayer(videoUrl, (p) => {
        p.play();
    });

    const [isPlaying, setIsPlaying] = useState(true);
    const [isBuffering, setIsBuffering] = useState(true);
    const [positionMs, setPositionMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [showControls, setShowControls] = useState(true);

    const controlsOpacity = useSharedValue(1);
    const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Orientation Lock ---
    useEffect(() => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        startHideTimer();
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        };
    }, []);

    // --- Player Status Polling ---
    useEffect(() => {
        const interval = setInterval(() => {
            if (player) {
                setIsPlaying(player.playing);
                setPositionMs(player.currentTime * 1000);
                setDurationMs((player.duration ?? 0) * 1000);
                setIsBuffering(player.status === 'loading');
            }
        }, 500);
        return () => clearInterval(interval);
    }, [player]);

    // --- Controls Visibility ---
    const startHideTimer = useCallback(() => {
        if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        hideControlsTimer.current = setTimeout(() => {
            controlsOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
                if (finished) runOnJS(setShowControls)(false);
            });
        }, 4000);
    }, []);

    const toggleControls = () => {
        if (showControls) {
            controlsOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
                if (finished) runOnJS(setShowControls)(false);
            });
            if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        } else {
            setShowControls(true);
            controlsOpacity.value = withTiming(1, { duration: 300 });
            startHideTimer();
        }
    };

    // --- Playback Controls ---
    const handlePlayPause = () => {
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
        startHideTimer();
    };

    const skipForward = () => {
        player.seekBy(10);
        startHideTimer();
    };

    const skipBackward = () => {
        player.seekBy(-10);
        startHideTimer();
    };

    const handleSeek = (value: number) => {
        if (durationMs > 0) {
            player.currentTime = (value * durationMs) / 1000;
        }
        startHideTimer();
    };

    // --- Helpers ---
    const formatTime = (millis: number) => {
        if (!millis || isNaN(millis) || millis < 0) return '00:00';
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const animatedControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <Pressable style={StyleSheet.absoluteFill} onPress={toggleControls}>
                <VideoView
                    player={player}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    nativeControls={false}
                />
            </Pressable>

            {/* Overlay Controls */}
            {showControls && (
                <Animated.View
                    style={[styles.controlsOverlay, animatedControlsStyle]}
                >
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <Pressable onPress={onBack} style={styles.iconButton}>
                            <ChevronLeft color="#fff" size={32} />
                        </Pressable>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <View style={{ width: 48 }} />
                    </View>

                    {/* Center Controls */}
                    <View style={styles.centerControls}>
                        <Pressable onPress={skipBackward} style={styles.centerButton}>
                            <RotateCcw color="#fff" size={36} />
                            <Text style={styles.skipText}>10</Text>
                        </Pressable>

                        {isBuffering ? (
                            <ActivityIndicator size="large" color="#E50914" />
                        ) : (
                            <Pressable onPress={handlePlayPause} style={[styles.centerButton, styles.playButton]}>
                                {isPlaying
                                    ? <Pause color="#fff" size={44} fill="#fff" />
                                    : <Play color="#fff" size={44} fill="#fff" />
                                }
                            </Pressable>
                        )}

                        <Pressable onPress={skipForward} style={styles.centerButton}>
                            <RotateCw color="#fff" size={36} />
                            <Text style={styles.skipText}>10</Text>
                        </Pressable>
                    </View>

                    {/* Bottom Bar */}
                    <View style={styles.bottomBar}>
                        <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={1}
                            value={durationMs > 0 ? positionMs / durationMs : 0}
                            onSlidingComplete={handleSeek}
                            minimumTrackTintColor="#E50914"
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor="#E50914"
                        />
                        <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'space-between',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    iconButton: {
        padding: 10,
    },
    title: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        maxWidth: '70%',
        textAlign: 'center',
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
    },
    centerButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    playButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    skipText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    slider: {
        flex: 1,
        height: 40,
        marginHorizontal: 12,
    },
    timeText: {
        color: '#fff',
        fontSize: 13,
        minWidth: 44,
        textAlign: 'center',
    },
});
