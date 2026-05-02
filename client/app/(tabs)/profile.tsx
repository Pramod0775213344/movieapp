import React, { useContext, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Image, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { 
  LogOut, ChevronRight, Settings, Bell, HelpCircle, 
  User, Shield, CreditCard, Download, Heart, Clock 
} from 'lucide-react-native';

const PRIMARY_COLOR = '#E50914';

const ProfileScreen = () => {
    const { user, logout, refreshUser } = useContext(AuthContext);
    const router = useRouter();

    // Refresh data whenever screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refreshUser();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Sign Out", 
                    onPress: () => {
                        console.log('User confirmed logout');
                        logout();
                    }, 
                    style: "destructive" 
                }
            ]
        );
    };

    const handleOptionPress = (label, route = null) => {
        if (route) {
            router.push(route);
        } else {
            Alert.alert("MOVIEAPP PRO", `${label} feature is coming soon!`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header Section - Animated */}
                <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' }} 
                            style={styles.avatar} 
                        />
                        <View style={styles.editBadge}>
                            <User size={14} color="#000" />
                        </View>
                    </View>
                    <Text style={styles.username}>{user?.username || 'User'}</Text>
                    <View style={styles.statusBadge}>
                        <Shield size={12} color={PRIMARY_COLOR} />
                        <Text style={styles.statusText}>PRO ACCOUNT</Text>
                    </View>
                </Animated.View>

                {/* Stats Row - Animated */}
                <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.statsRow}>
                    <Pressable style={styles.statItem} onPress={() => router.push('/watchlist')}>
                        <Text style={styles.statValue}>{user?.watchlist?.length || 0}</Text>
                        <Text style={styles.statLabel}>Watchlist</Text>
                    </Pressable>
                    <View style={[styles.statItem, styles.statDivider]}>
                        <Text style={styles.statValue}>{user?.history?.length || 0}</Text>
                        <Text style={styles.statLabel}>Viewed</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>Pro</Text>
                        <Text style={styles.statLabel}>Plan</Text>
                    </View>
                </Animated.View>

                {/* Menu Groups - Animated with Layout transition */}
                <Animated.View entering={FadeInUp.delay(600).duration(800)} layout={Layout.springify()} style={styles.section}>
                    <Text style={styles.sectionLabel}>Library & Activity</Text>
                    <View style={styles.card}>
                        <MenuButton 
                            icon={<Heart size={20} color="#fff" />} 
                            label="My Watchlist" 
                            onPress={() => handleOptionPress('Watchlist', '/watchlist')}
                        />
                        <MenuButton 
                            icon={<Download size={20} color="#fff" />} 
                            label="Downloads" 
                            onPress={() => handleOptionPress('Downloads')}
                        />
                        <MenuButton 
                            icon={<Clock size={20} color="#fff" />} 
                            label="Watching History" 
                            onPress={() => handleOptionPress('History')}
                            isLast 
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.section}>
                    <Text style={styles.sectionLabel}>System Settings</Text>
                    <View style={styles.card}>
                        <MenuButton 
                            icon={<Bell size={20} color="#fff" />} 
                            label="Notifications" 
                            onPress={() => handleOptionPress('Notifications')}
                        />
                        <MenuButton 
                            icon={<CreditCard size={20} color="#fff" />} 
                            label="Subscription" 
                            onPress={() => handleOptionPress('Subscription')}
                        />
                        <MenuButton 
                            icon={<Settings size={20} color="#fff" />} 
                            label="App Preferences" 
                            onPress={() => handleOptionPress('Settings')}
                            isLast 
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.section}>
                    <View style={styles.card}>
                        <MenuButton 
                            icon={<HelpCircle size={20} color="#fff" />} 
                            label="Help Center" 
                            onPress={() => handleOptionPress('Help')}
                            isLast
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(1200).duration(800)}>
                    <Pressable 
                        style={({ pressed }) => [
                            styles.mainLogoutBtn,
                            pressed && { backgroundColor: 'rgba(255, 77, 77, 0.15)', transform: [{ scale: 0.98 }] }
                        ]} 
                        onPress={handleLogout}
                    >
                        <LogOut size={20} color="#ff4d4d" />
                        <Text style={styles.logoutText}>Sign Out from MovieApp</Text>
                    </Pressable>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const MenuButton = ({ icon, label, isLast, onPress }) => (
    <Pressable 
        style={({ pressed }) => [
            styles.menuItem, 
            isLast && { borderBottomWidth: 0 },
            pressed && { backgroundColor: '#1a1a1a' }
        ]} 
        onPress={onPress}
    >
        <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.menuText}>{label}</Text>
        </View>
        <ChevronRight size={18} color="#444" />
    </Pressable>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    header: {
        alignItems: 'center',
        paddingTop: 30,
        paddingBottom: 25,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: PRIMARY_COLOR,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: PRIMARY_COLOR,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#050505',
    },
    username: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '800',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(229, 9, 20, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8,
        gap: 5,
    },
    statusText: {
        color: PRIMARY_COLOR,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#111',
        marginHorizontal: 20,
        borderRadius: 20,
        paddingVertical: 15,
        marginBottom: 30,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#222',
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        color: '#666',
        fontSize: 11,
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionLabel: {
        color: '#444',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 20,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 15,
    },
    mainLogoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 10,
        paddingVertical: 18,
        backgroundColor: 'rgba(255, 77, 77, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 77, 77, 0.1)',
        gap: 12,
    },
    logoutText: {
        color: '#ff4d4d',
        fontSize: 16,
        fontWeight: '700',
    }
});

export default ProfileScreen;
