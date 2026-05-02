import React from 'react';
import { StyleSheet, View, ImageBackground, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

const FeaturedMovie = ({ movie }) => {
    const router = useRouter();
    if (!movie) return null;

    const SERVER_IP = '192.168.19.21';
    
    // Support for both R2 and TMDB posters
    const posterUrl = movie.isCustom
        ? (movie.poster_url?.startsWith('http') ? movie.poster_url : `http://${SERVER_IP}:5000/${movie.poster_url}`)
        : `https://image.tmdb.org/t/p/original${movie.poster_path}`;

    const handlePlay = () => {
        router.push({
            pathname: `/player/${movie.id}`,
            params: { 
                isCustom: movie.isCustom ? 'true' : 'false', 
                videoPath: movie.isCustom ? movie.video_url : '',
                title: movie.title
            }
        });
    };

    return (
        <Animated.View entering={FadeInDown.duration(1000)}>
            <ImageBackground source={{ uri: posterUrl }} style={styles.container}>
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', '#000']}
                    style={styles.gradient}
                >
                    <View style={styles.content}>
                        <Text style={styles.title}>{movie.title}</Text>
                        <View style={styles.buttonContainer}>
                            <Pressable style={styles.playButton} onPress={handlePlay}>
                                <Play size={20} color="#000" fill="#000" />
                                <Text style={styles.playText}>Play</Text>
                            </Pressable>
                            <Pressable style={styles.watchlistButton} onPress={() => router.push(`/movie/${movie.id}`)}>
                                <View style={styles.iconCircle}>
                                    <Plus size={24} color="#fff" />
                                </View>
                                <Text style={styles.watchlistText}>My List</Text>
                            </Pressable>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 550,
        justifyContent: 'flex-end',
    },
    gradient: {
        height: '100%',
        justifyContent: 'flex-end',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 25,
        textShadow: '-1px 1px 10px rgba(0, 0, 0, 0.75)',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 35,
        paddingVertical: 12,
        borderRadius: 6,
        marginHorizontal: 15,
        elevation: 5,
    },
    playText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 18,
    },
    watchlistButton: {
        alignItems: 'center',
        marginHorizontal: 15,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    watchlistText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    }
});

export default FeaturedMovie;
