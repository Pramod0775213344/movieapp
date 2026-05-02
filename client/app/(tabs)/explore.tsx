import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, FlatList, ActivityIndicator, Text } from 'react-native';
import { Search as SearchIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import MovieCard from '@/components/MovieCard';
import api from '@/api';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query) {
                performSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/movies/search`, { params: { query } });
            setResults(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }) => (
        <Animated.View 
            entering={FadeInUp.delay(index * 50).duration(400)}
            style={styles.cardWrapper}
        >
            <MovieCard movie={item} width={110} height={165} />
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View entering={FadeInDown.duration(600)} style={styles.searchBar}>
                <SearchIcon size={20} color="#aaa" style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Search movies..."
                    placeholderTextColor="#aaa"
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                />
            </Animated.View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                </View>
            ) : (
                <Animated.FlatList
                    data={results}
                    numColumns={3}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    layout={Layout.springify()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        query && !loading ? (
                            <Animated.Text entering={FadeInUp} style={styles.emptyText}>
                                No movies found for "{query}"
                            </Animated.Text>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 16,
        height: 55,
        borderWidth: 1,
        borderColor: '#222',
    },
    searchIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 10,
        paddingBottom: 100,
    },
    cardWrapper: {
        flex: 1,
        alignItems: 'center',
        marginVertical: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        fontWeight: '500',
    }
});
