import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, FlatList, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import FeaturedMovie from '@/components/FeaturedMovie';
import SectionHeader from '@/components/SectionHeader';
import MovieCard from '@/components/MovieCard';
import api from '@/api';

export default function HomeScreen() {
    const [featured, setFeatured] = useState(null);
    const [trending, setTrending] = useState([]);
    const [popular, setPopular] = useState([]);
    const [exclusives, setExclusives] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [trendingRes, popularRes, exclusivesRes] = await Promise.all([
                api.get('/movies/trending'),
                api.get('/movies/popular'),
                api.get('/admin/movies').catch(() => ({ data: [] }))
            ]);
            
            setTrending(trendingRes.data);
            setPopular(popularRes.data);
            setExclusives(exclusivesRes.data);
            setFeatured(trendingRes.data[0]);
        } catch (err) {
            console.error('Fetch error:', err);
            const mockMovies = [
                { id: 1, title: 'Inception', poster_path: '/edvWebvMsI79S2j9vyL6qa9vSTU.jpg' },
                { id: 2, title: 'Interstellar', poster_path: '/gEU2QniE6E77NI6vCU679iJuH7s.jpg' },
                { id: 3, title: 'The Dark Knight', poster_path: '/qJ2tW6WMUDp9QmSJJivpUunD29x.jpg' },
                { id: 4, title: 'Avatar', poster_path: '/jRXYjXuvqW7YpSqiGj2p2tPqtRi.jpg' },
                { id: 5, title: 'Titanic', poster_path: '/9xj7rB6R7vOLQvGpAFBD9S3urZD.jpg' },
            ];
            setTrending(mockMovies);
            setPopular(mockMovies);
            setFeatured(mockMovies[0]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} bounces={false} showsVerticalScrollIndicator={false}>
            <StatusBar style="light" />
            
            <Animated.View entering={FadeIn.duration(1000)}>
                <FeaturedMovie movie={featured} />
            </Animated.View>

            <View style={styles.content}>
                {exclusives.length > 0 && (
                    <Animated.View entering={FadeInUp.delay(200).duration(800)} layout={Layout.springify()}>
                        <SectionHeader title="Exclusives on MovieApp" />
                        <FlatList
                            horizontal
                            data={exclusives}
                            keyExtractor={(item) => item._id}
                            renderItem={({ item }) => (
                                <MovieCard 
                                    movie={{
                                        id: item._id,
                                        title: item.title,
                                        poster_path: item.posterPath,
                                        isCustom: true
                                    }} 
                                />
                            )}
                            showsHorizontalScrollIndicator={false}
                        />
                    </Animated.View>
                )}
                
                <Animated.View entering={FadeInUp.delay(400).duration(800)}>
                    <SectionHeader title="Trending Now" />
                    <FlatList
                        horizontal
                        data={trending}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => <MovieCard movie={item} />}
                        showsHorizontalScrollIndicator={false}
                    />
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(600).duration(800)}>
                    <SectionHeader title="Popular on MovieApp" />
                    <FlatList
                        horizontal
                        data={popular}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => <MovieCard movie={item} />}
                        showsHorizontalScrollIndicator={false}
                    />
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(800).duration(800)}>
                    <SectionHeader title="New Releases" />
                    <FlatList
                        horizontal
                        data={trending.slice().reverse()}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => <MovieCard movie={item} />}
                        showsHorizontalScrollIndicator={false}
                    />
                </Animated.View>
            </View>
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        marginTop: -20,
    }
});
