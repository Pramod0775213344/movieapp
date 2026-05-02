import React, { useState, useContext } from 'react';
import {
    StyleSheet, View, Text, TextInput, Pressable,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    Dimensions, ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Eye, EyeOff, Mail, Lock, Play } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const PRIMARY = '#E50914';

// Cinematic backdrop — a dark movie-themed image
const BACKDROP = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState<'email' | 'password' | null>(null);
    const { login } = useContext(AuthContext);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.root}
        >
            {/* ── Cinematic Background ── */}
            <ImageBackground source={{ uri: BACKDROP }} style={styles.backdrop} resizeMode="cover">
                <LinearGradient
                    colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.65)', '#000']}
                    style={styles.overlay}
                />
            </ImageBackground>

            {/* ── Content ── */}
            <View style={styles.content}>

                {/* Logo */}
                <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.logoWrapper}>
                    <View style={styles.logoGlow} />
                    <View style={styles.logoCircle}>
                        <Play size={28} color="#fff" fill="#fff" />
                    </View>
                    <Text style={styles.logoText}>MovieApp</Text>
                </Animated.View>

                {/* Tagline */}
                <Animated.Text entering={FadeInDown.delay(250).duration(600)} style={styles.tagline}>
                    Unlimited Entertainment
                </Animated.Text>

                {/* Card */}
                <Animated.View entering={FadeInUp.delay(350).duration(700)} style={styles.card}>
                    <Text style={styles.cardTitle}>Sign In</Text>

                    {/* Error */}
                    {!!error && (
                        <Animated.View entering={FadeIn.duration(300)} style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </Animated.View>
                    )}

                    {/* Email */}
                    <View style={[styles.inputRow, focused === 'email' && styles.inputRowFocused]}>
                        <Mail size={18} color={focused === 'email' ? PRIMARY : '#555'} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email address"
                            placeholderTextColor="#444"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onFocus={() => setFocused('email')}
                            onBlur={() => setFocused(null)}
                        />
                    </View>

                    {/* Password */}
                    <View style={[styles.inputRow, focused === 'password' && styles.inputRowFocused]}>
                        <Lock size={18} color={focused === 'password' ? PRIMARY : '#555'} />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Password"
                            placeholderTextColor="#444"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPass}
                            onFocus={() => setFocused('password')}
                            onBlur={() => setFocused(null)}
                        />
                        <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8}>
                            {showPass
                                ? <EyeOff size={18} color="#555" />
                                : <Eye size={18} color="#555" />
                            }
                        </Pressable>
                    </View>

                    {/* Sign In Button */}
                    <Pressable
                        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }, loading && { opacity: 0.7 }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#ff1f2e', PRIMARY, '#b30000']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.btnText}>Sign In</Text>
                            }
                        </LinearGradient>
                    </Pressable>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Register Link */}
                    <Pressable onPress={() => router.push('/register')} style={styles.registerLink}>
                        <Text style={styles.registerText}>
                            New to MovieApp?{'  '}
                            <Text style={styles.registerBold}>Create account</Text>
                        </Text>
                    </Pressable>
                </Animated.View>

                {/* Bottom tagline */}
                <Animated.Text entering={FadeInUp.delay(550).duration(600)} style={styles.bottomNote}>
                    Stream movies & shows anytime, anywhere.
                </Animated.Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#000',
    },

    // Background
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        width,
        height,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },

    // Content
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    // Logo
    logoWrapper: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logoGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: PRIMARY,
        opacity: 0.2,
        top: -4,
    },
    logoCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    tagline: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        textAlign: 'center',
        letterSpacing: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 32,
    },

    // Card
    card: {
        backgroundColor: 'rgba(12,12,12,0.92)',
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 22,
    },

    // Error
    errorBox: {
        backgroundColor: 'rgba(229,9,20,0.12)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(229,9,20,0.3)',
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Inputs
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#111',
        borderRadius: 14,
        paddingHorizontal: 18,
        height: 58,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#222',
    },
    inputRowFocused: {
        borderColor: PRIMARY,
        backgroundColor: '#141414',
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },

    // Button
    btn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
    },
    btnGradient: {
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 22,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#222',
    },
    dividerText: {
        color: '#444',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },

    // Register
    registerLink: {
        alignItems: 'center',
    },
    registerText: {
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
    },
    registerBold: {
        color: '#fff',
        fontWeight: '800',
    },

    // Bottom note
    bottomNote: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 28,
        letterSpacing: 0.5,
    },
});
