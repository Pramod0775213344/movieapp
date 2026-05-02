import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';

const PRIMARY_COLOR = '#E50914';

const RegisterScreen = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const router = useRouter();

    const handleRegister = async () => {
        if (!username || !email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await register(username, email, password);
            router.replace('/(tabs)');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#050505', '#1a1a1a', '#050505']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Animated.Text entering={FadeInUp.delay(200).duration(800)} style={styles.title}>Create Account</Animated.Text>

                    {error ? (
                        <Animated.Text entering={FadeIn.duration(400)} style={styles.errorText}>
                            {error}
                        </Animated.Text>
                    ) : null}

                    <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#666"
                            value={username}
                            onChangeText={setUsername}
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(1000).duration(800)}>
                        <Pressable 
                            style={({ pressed }) => [
                                styles.button, 
                                loading && styles.disabledButton,
                                pressed && { transform: [{ scale: 0.98 }] }
                            ]} 
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Get Started</Text>
                            )}
                        </Pressable>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(1200).duration(800)}>
                        <Pressable style={styles.linkButton} onPress={() => router.back()}>
                            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Sign in.</Text></Text>
                        </Pressable>
                    </Animated.View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 35,
        letterSpacing: -0.5,
    },
    inputContainer: {
        backgroundColor: '#111',
        borderRadius: 12,
        marginBottom: 16,
        height: 64,
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#222',
    },
    input: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        backgroundColor: PRIMARY_COLOR,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    errorText: {
        color: PRIMARY_COLOR,
        marginBottom: 20,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    linkButton: {
        marginTop: 35,
        alignItems: 'center',
    },
    linkText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    linkTextBold: {
        color: '#fff',
        fontWeight: '800',
    }
});

export default RegisterScreen;
