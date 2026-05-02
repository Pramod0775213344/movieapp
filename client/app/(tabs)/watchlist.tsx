import React, { useState, useEffect, useContext, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Heart, Play, Film, Search } from 'lucide-react-native';
import api from '@/api';

const PRIMARY_COLOR = '#E50914';

const WatchlistScreen = () => {
    const { user, refreshUser } = useContext(AuthContext);
    const [watchlist, setWatchlist] = useState(user?.watchlist || []);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshUser();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        setWatchlist(user?.watchlist || []);
    }, [user?.watchlist]);

    const renderItem = ({ item, index }) => (
        <Animated.View 
            entering={FadeInDown.delay(index * 100).duration(600)}
            layout={Layout.springify()}
            style={styles.movieCard}
        >
            <Pressable 
                style={({ pressed }) => [
                    { flex: 1 },
                    pressed && { transform: [{ scale: 0.98 }] }
                ]}
                onPress={() => router.push(`/movie/${item.movieId}`)}
            >
                <Image 
                    source={{ uri: `https://image.tmdb.org/t/p/w500${item.posterPath}` }} 
                    style={styles.poster}
                />
                <View style={styles.movieInfo}>
                    <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.playBtn}>
                        <Play size={14} color="#000" fill="#000" />
                        <Text style={styles.playText}>Watch Now</Text>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Watchlist</Text>
                <Text style={styles.headerCount}>{watchlist.length} Titles</Text>
            </View>

            {watchlist.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBg}>
                        <Heart size={40} color={PRIMARY_COLOR} />
                    </View>
                    <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
                    <Text style={styles.emptySub}>Add movies and shows you want to watch later.</Text>
                    <Pressable 
                        style={styles.exploreBtn}
                        onPress={() => router.push('/explore')}
                    >
                        <Search size={18} color="#000" />
                        <Text style={styles.exploreText}>Explore Content</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={watchlist}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.movieId.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_COLOR} />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    headerCount: {
        color: PRIMARY_COLOR,
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    movieCard: {
        width: '48%',
        backgroundColor: '#111',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    poster: {
        width: '100%',
        height: 220,
        backgroundColor: '#222',
    },
    movieInfo: {
        padding: 12,
    },
    movieTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
        height: 40,
    },
    playBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        justifyContent: 'center',
        gap: 6,
    },
    playText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '800',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(229, 9, 20, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 10,
    },
    emptySub: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 10,
    },
    exploreText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '800',
    }
});

export default WatchlistScreen;
