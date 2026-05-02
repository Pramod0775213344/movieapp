import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, Image,
    Pressable, RefreshControl, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInRight, Layout, ZoomOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Play, Trash2, Film, Search, BookmarkCheck } from 'lucide-react-native';
import api from '@/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PRIMARY = '#E50914';
const GOLD = '#F5C518';

// ─── Remove helper ────────────────────────────────────────────────
const removeFromWatchlist = async (movieId: string) => {
    await api.post('/user/watchlist/toggle', {
        movie: { id: movieId, title: '' }   // toggle removes if present
    });
};

// ─── Movie Card ───────────────────────────────────────────────────
const MovieCard = ({ item, index, onRemove, onPress }: any) => {
    const posterUrl = item.poster_path?.startsWith('http')
        ? item.poster_path
        : `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 80).duration(500).springify()}
            exiting={ZoomOut.duration(300)}
            layout={Layout.springify()}
            style={styles.card}
        >
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
                {/* Poster */}
                <View style={styles.posterWrapper}>
                    <Image source={{ uri: posterUrl }} style={styles.poster} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        style={styles.posterGradient}
                    />
                    {/* Play overlay */}
                    <View style={styles.playOverlay}>
                        <View style={styles.playCircle}>
                            <Play size={18} color="#fff" fill="#fff" />
                        </View>
                    </View>
                    {/* Remove btn */}
                    <Pressable
                        onPress={onRemove}
                        style={styles.removeBtn}
                        hitSlop={8}
                    >
                        <Trash2 size={14} color="#fff" />
                    </Pressable>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.cardMeta}>
                        <View style={styles.ratingPill}>
                            <Text style={styles.ratingText}>★ {item.vote_average?.toFixed?.(1) ?? '—'}</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

// ─── Empty State ──────────────────────────────────────────────────
const EmptyState = ({ onExplore }: { onExplore: () => void }) => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
        <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconInner}>
                <BookmarkCheck size={44} color={PRIMARY} />
            </View>
        </View>
        <Text style={styles.emptyTitle}>Nothing saved yet</Text>
        <Text style={styles.emptySub}>
            Movies and shows you save will appear here. Start exploring!
        </Text>
        <Pressable style={styles.exploreBtn} onPress={onExplore}>
            <Search size={16} color="#000" />
            <Text style={styles.exploreBtnText}>Explore Content</Text>
        </Pressable>
    </Animated.View>
);

// ─── Main Screen ──────────────────────────────────────────────────
const WatchlistScreen = () => {
    const { user, refreshUser } = useContext(AuthContext);
    const [watchlist, setWatchlist] = useState<any[]>(user?.watchlist || []);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setWatchlist(user?.watchlist || []);
    }, [user?.watchlist]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshUser();
        setRefreshing(false);
    }, []);

    const handleRemove = (item: any) => {
        Alert.alert(
            'Remove from Watchlist',
            `Remove "${item.title}" from your list?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive', onPress: async () => {
                        // Optimistic update
                        setWatchlist(prev => prev.filter(m => m.movieId !== item.movieId));
                        try {
                            await removeFromWatchlist(item.movieId);
                        } catch {
                            // Revert on error
                            await refreshUser();
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ── Header ── */}
            <Animated.View entering={FadeInRight.duration(500)} style={styles.header}>
                <View>
                    <Text style={styles.headerLabel}>MY LIST</Text>
                    <Text style={styles.headerTitle}>Watchlist</Text>
                </View>
                <View style={styles.countBadge}>
                    <Film size={14} color={PRIMARY} />
                    <Text style={styles.countText}>{watchlist.length}</Text>
                </View>
            </Animated.View>

            {/* ── Divider ── */}
            <View style={styles.divider} />

            {watchlist.length === 0 ? (
                <EmptyState onExplore={() => router.push('/explore')} />
            ) : (
                <FlatList
                    data={watchlist}
                    keyExtractor={(item) => item.movieId?.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={PRIMARY}
                            colors={[PRIMARY]}
                        />
                    }
                    renderItem={({ item, index }) => (
                        <MovieCard
                            item={item}
                            index={index}
                            onPress={() => router.push(`/movie/${item.movieId}`)}
                            onRemove={() => handleRemove(item)}
                        />
                    )}
                    ListHeaderComponent={
                        <Animated.Text
                            entering={FadeInDown.delay(100).duration(400)}
                            style={styles.listSubtitle}
                        >
                            Tap a title to view details
                        </Animated.Text>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default WatchlistScreen;

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080808',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerLabel: {
        color: PRIMARY,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    countBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(229,9,20,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(229,9,20,0.3)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    countText: {
        color: PRIMARY,
        fontSize: 16,
        fontWeight: '800',
    },

    divider: {
        height: 1,
        backgroundColor: '#1a1a1a',
        marginHorizontal: 20,
        marginBottom: 8,
    },

    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
        paddingTop: 4,
    },
    listSubtitle: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 0.3,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    // Card
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#111',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1e1e1e',
    },
    posterWrapper: {
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: CARD_WIDTH * 1.45,
        backgroundColor: '#1a1a1a',
    },
    posterGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    playOverlay: {
        position: 'absolute',
        bottom: 10,
        left: 10,
    },
    playCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(229,9,20,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Card Info
    cardInfo: {
        padding: 10,
        gap: 6,
    },
    cardTitle: {
        color: '#f0f0f0',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingPill: {
        backgroundColor: 'rgba(245,197,24,0.15)',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    ratingText: {
        color: GOLD,
        fontSize: 11,
        fontWeight: '700',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    emptyIconRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: 'rgba(229,9,20,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyIconInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(229,9,20,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    emptySub: {
        color: '#555',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: PRIMARY,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
        marginTop: 8,
    },
    exploreBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
});
