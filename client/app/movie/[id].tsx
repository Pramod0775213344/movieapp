import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Plus, ChevronLeft, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/api';

const MovieDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);

    const BACKEND_URL = 'https://movieapp-production-8fce.up.railway.app';

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            // Unified route for all movies in the internal system
            const response = await api.get(`/movies/${id}`);
            setMovie(response.data);
            
            const watchlistRes = await api.get('/user/watchlist').catch(() => ({ data: [] }));
            setInWatchlist(watchlistRes.data.some(m => m.movieId === id));
        } catch (err) {
            console.error('Fetch error:', err);
            setMovie(null);
        } finally {
            setLoading(false);
        }
    };

    const toggleWatchlist = async () => {
        try {
            await api.post('/user/watchlist/toggle', {
                movie: {
                    id: id,
                    title: movie.title,
                    poster_path: movie.isCustom ? movie.poster_url : movie.poster_path
                }
            });
            setInWatchlist(!inWatchlist);
        } catch (err) {
            console.error('Watchlist Error:', err);
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#E50914" style={{ flex: 1, backgroundColor: '#000' }} />;
    if (!movie) return <View style={styles.container}><Text style={{ color: '#fff' }}>Movie not found</Text></View>;

    const backdropUrl = movie.isCustom
        ? (movie.poster_url?.startsWith('http') ? movie.poster_url : `${BACKEND_URL}/${movie.poster_url}`)
        : `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`;

    return (
        <ScrollView style={styles.container} bounces={false}>
            <View style={styles.header}>
                <Image 
                    source={{ uri: backdropUrl }} 
                    style={styles.backdrop} 
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', '#000']}
                    style={styles.gradient}
                />
                <Pressable style={[styles.backButton, { top: insets.top + 10 }]} onPress={() => router.back()}>
                    <ChevronLeft size={30} color="#fff" />
                </Pressable>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.title}>{movie.title}</Text>
                
                <View style={styles.meta}>
                    <Text style={styles.year}>
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : '2024'}
                    </Text>
                    <View style={styles.ratingBox}>
                        <Text style={styles.ratingText}>
                            {movie.vote_average ? Number(movie.vote_average).toFixed(1) : '8.5'}
                        </Text>
                    </View>
                    <Text style={styles.runtime}>{movie.runtime || movie.duration || '120'}m</Text>
                    {movie.isCustom && <View style={styles.premiumBadge}><Text style={styles.premiumText}>R2 CLOUD</Text></View>}
                </View>

                <Pressable 
                    style={styles.playButton} 
                    onPress={() => router.push({
                        pathname: `/player/${id}`,
                        params: { 
                            isCustom: movie.isCustom ? 'true' : 'false', 
                            videoPath: movie.isCustom ? movie.video_url : '',
                            title: movie.title
                        }
                    })}
                >
                    <Play size={20} color="#000" fill="#000" />
                    <Text style={styles.playText}>Play</Text>
                </Pressable>

                <Pressable style={styles.listButton} onPress={toggleWatchlist}>
                    {inWatchlist ? <Check size={24} color="#E50914" /> : <Plus size={24} color="#fff" />}
                    <Text style={[styles.listText, inWatchlist && { color: '#E50914' }]}>
                        {inWatchlist ? 'Added' : 'My List'}
                    </Text>
                </Pressable>

                <Text style={styles.overview}>{movie.overview || movie.description || 'No description available for this title.'}</Text>

                {movie.credits?.cast && movie.credits.cast.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Cast</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {movie.credits.cast.slice(0, 10).map((person) => (
                                <View key={person?.id || Math.random().toString()} style={styles.castItem}>
                                    <Image 
                                        source={{ uri: person?.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : 'https://via.placeholder.com/100x100?text=No+Image' }} 
                                        style={styles.castImage} 
                                    />
                                    <Text style={styles.castName} numberOfLines={2}>{person?.name || 'Actor'}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        height: 300,
    },
    backdrop: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    infoContainer: {
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    year: {
        color: '#aaa',
        marginRight: 15,
    },
    ratingBox: {
        backgroundColor: '#333',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 15,
    },
    ratingText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    runtime: {
        color: '#aaa',
    },
    premiumBadge: {
        backgroundColor: 'rgba(229, 9, 20, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 15,
        borderWidth: 1,
        borderColor: '#E50914',
    },
    premiumText: {
        color: '#E50914',
        fontSize: 10,
        fontWeight: 'bold',
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 5,
        marginBottom: 15,
    },
    playText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 18,
    },
    listButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        paddingVertical: 12,
        borderRadius: 5,
        marginBottom: 20,
    },
    listText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 10,
    },
    overview: {
        color: '#fff',
        lineHeight: 24,
        fontSize: 16,
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    castItem: {
        width: 100,
        marginRight: 15,
    },
    castImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 5,
    },
    castName: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 12,
    }
});

export default MovieDetailScreen;
