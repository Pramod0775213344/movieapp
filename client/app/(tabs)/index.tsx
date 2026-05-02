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
            const response = await api.get('/admin/movies');
            const customMovies = response.data.map(m => ({
                ...m,
                id: m.id || m._id,
                isCustom: true,
                poster_path: m.poster_url || m.posterPath
            }));
            
            setExclusives(customMovies);
            setTrending(customMovies.slice().reverse()); // Show recently added as trending
            setPopular(customMovies);
            setFeatured(customMovies[0] || null);
        } catch (err) {
            console.error('Fetch error:', err);
            setExclusives([]);
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
                {exclusives.length > 0 ? (
                    <>
                        <Animated.View entering={FadeInUp.delay(200).duration(800)} layout={Layout.springify()}>
                            <SectionHeader title="Recently Added" />
                            <FlatList
                                horizontal
                                data={trending}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => <MovieCard movie={item} />}
                                showsHorizontalScrollIndicator={false}
                            />
                        </Animated.View>
                        
                        <Animated.View entering={FadeInUp.delay(400).duration(800)}>
                            <SectionHeader title="Exclusive on MovieApp" />
                            <FlatList
                                horizontal
                                data={exclusives}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => <MovieCard movie={item} />}
                                showsHorizontalScrollIndicator={false}
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(600).duration(800)}>
                            <SectionHeader title="Recommended for You" />
                            <FlatList
                                horizontal
                                data={popular}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => <MovieCard movie={item} />}
                                showsHorizontalScrollIndicator={false}
                            />
                        </Animated.View>
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <SectionHeader title="No Content Yet" />
                    </View>
                )}
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
