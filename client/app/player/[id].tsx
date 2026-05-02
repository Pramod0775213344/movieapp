import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Text, ActivityIndicator, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Play, Pause, RotateCcw, RotateCw, Maximize, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const PRIMARY_COLOR = '#E50914';

const VideoPlayerScreen = () => {
    const { id, isCustom, videoPath, title } = useLocalSearchParams();
    const router = useRouter();
    const video = useRef(null);
    const [status, setStatus] = useState({});
    const [showControls, setShowControls] = useState(true);
    const controlsOpacity = useSharedValue(1);

    // Sync with the same IP used in api/index.js
    const BACKEND_URL = 'https://movieapp-production-8fce.up.railway.app';
    // Handle Cloudinary/R2 URLs vs Local paths
    const videoSource = isCustom 
        ? (videoPath.startsWith('http') ? videoPath : `${BACKEND_URL}/${videoPath}`)
        : "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4";

    useEffect(() => {
        let timer;
        if (showControls) {
            controlsOpacity.value = withTiming(1, { duration: 300 });
            timer = setTimeout(() => {
                if (status.isPlaying) {
                    setShowControls(false);
                    controlsOpacity.value = withTiming(0, { duration: 300 });
                }
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [showControls, status.isPlaying]);

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    const formatTime = (millis) => {
        const totalSeconds = millis / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handlePlayPause = () => {
        status.isPlaying ? video.current.pauseAsync() : video.current.playAsync();
    };

    const handleSkip = async (seconds) => {
        const newPosition = status.positionMillis + (seconds * 1000);
        await video.current.setPositionAsync(newPosition);
    };

    const animatedControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            
            <Pressable style={styles.videoWrapper} onPress={toggleControls} activeOpacity={1}>
                <Video
                    ref={video}
                    style={styles.video}
                    source={{ uri: videoSource }}
                    resizeMode={ResizeMode.CONTAIN}
                    onPlaybackStatusUpdate={status => setStatus(() => status)}
                    shouldPlay
                />
            </Pressable>

            {/* Custom Controls Overlay */}
            {showControls && (
                <Animated.View 
                    entering={FadeIn} 
                    exiting={FadeOut} 
                    style={[styles.overlay, animatedControlsStyle]}
                    pointerEvents={showControls ? 'auto' : 'none'}
                >
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                            <ChevronLeft size={28} color="#fff" />
                        </Pressable>
                        <Text style={styles.movieTitle} numberOfLines={1}>{title || 'Streaming Content'}</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {/* Middle Controls */}
                    <View style={styles.mainControls}>
                        <Pressable onPress={() => handleSkip(-10)} style={styles.skipBtn}>
                            <RotateCcw size={32} color="#fff" />
                            <Text style={styles.skipText}>10s</Text>
                        </Pressable>

                        <Pressable onPress={handlePlayPause} style={styles.playPauseBtn}>
                            {status.isBuffering ? (
                                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                            ) : status.isPlaying ? (
                                <Pause size={45} color="#fff" fill="#fff" />
                            ) : (
                                <Play size={45} color="#fff" fill="#fff" />
                            )}
                        </Pressable>

                        <Pressable onPress={() => handleSkip(10)} style={styles.skipBtn}>
                            <RotateCw size={32} color="#fff" />
                            <Text style={styles.skipText}>10s</Text>
                        </Pressable>
                    </View>

                    {/* Bottom Bar / Progress */}
                    <View style={styles.bottomBar}>
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeText}>{formatTime(status.positionMillis || 0)}</Text>
                            <View style={styles.progressBarContainer}>
                                <View style={styles.progressBarBg}>
                                    <View 
                                        style={[
                                            styles.progressBarFill, 
                                            { width: `${(status.positionMillis / status.durationMillis) * 100}%` }
                                        ]} 
                                    />
                                </View>
                            </View>
                            <Text style={styles.timeText}>{formatTime(status.durationMillis || 0)}</Text>
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoWrapper: {
        flex: 1,
    },
    video: {
        flex: 1,
        width: width,
        height: height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    movieTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    iconBtn: {
        padding: 10,
    },
    mainControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 50,
    },
    playPauseBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    skipBtn: {
        alignItems: 'center',
        gap: 5,
    },
    skipText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    bottomBar: {
        width: '100%',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    timeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        minWidth: 35,
    },
    progressBarContainer: {
        flex: 1,
    },
    progressBarBg: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 2,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    }
});

export default VideoPlayerScreen;
