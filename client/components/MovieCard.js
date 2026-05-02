import React from 'react';
import { StyleSheet, Pressable, Image, View } from 'react-native';
import { useRouter } from 'expo-router';

const MovieCard = ({ movie, width = 120, height = 180 }) => {
    const router = useRouter();

    const SERVER_IP = '192.168.19.21';
    const posterUrl = movie.isCustom
        ? (movie.poster_path.startsWith('http') ? movie.poster_path : `http://${SERVER_IP}:5000/${movie.poster_path}`)
        : (movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Poster');

    return (
        <Pressable 
            style={[styles.container, { width, height }]}
            onPress={() => router.push(`/movie/${movie.id}`)}
        >
            <Image 
                source={{ uri: posterUrl }} 
                style={styles.poster}
                resizeMode="cover"
            />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 8,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    poster: {
        width: '100%',
        height: '100%',
    }
});

export default MovieCard;
