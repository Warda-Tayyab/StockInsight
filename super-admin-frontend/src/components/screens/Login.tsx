'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { LoginApiResponse, ApiError } from '@/types/super-admin';

interface ImageBackgroundProps {
    imageUrl: string;
}

interface FormInputProps {
    icon: React.ReactNode;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

// FormInput Component
const FormInput: React.FC<FormInputProps> = ({ icon, type, placeholder, value, onChange, required }) => {
    return (
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                {icon}
            </div>
            <Input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
                className="pl-10 h-10 border-foreground/20"
            />
        </div>
    );
};

// ImageBackground Component
const ImageBackground: React.FC<ImageBackgroundProps> = ({ imageUrl }) => {
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-xs" />
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${imageUrl})` }}
            />
        </div>
    );
};

// Main LoginForm Component
const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('superadmin@tickflo.com');
    const [password, setPassword] = useState('SuperAdmin123!');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isAuthenticated, isLoading, login } = useAuth();

    const router = useRouter();

    React.useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleLogin = async (email: string, password: string) => {
        try {
            const response = await axiosInstance.post('/v1/auth/admin/login', { email, password });

            let token: string | undefined;
            const responseData = response.data as LoginApiResponse;

            if (responseData?.success && responseData?.data?.tokens?.accessToken) {
                token = responseData.data.tokens.accessToken;
            }

            if (!token) {
                console.error('No token found in response:', responseData);
                throw new Error('No token received from server');
            }
            toast.success('Login successful!');

            setTimeout(async () => {
                try {
                    // Pass both token and admin data to login function
                    await login(token, responseData.data.admin);
                } catch (loginError) {
                    console.error('Login error:', loginError);
                    toast.error('Login validation failed. Please try again.');
                }
            }, 500);
        } catch (error: unknown) {
            const apiError = error as ApiError;
            console.error('Login failed:', apiError);
            if (apiError?.response?.status === 401) {
                toast.error('Login failed. Please try again.', {
                    description: 'Invalid email or password.',
                });
            } else if (apiError?.response?.status === 500) {
                toast.error('Server error. Please try again later.');
            } else if (apiError?.message?.includes('Network')) {
                toast.error('Network error. Please check your internet connection.');
            } else if (apiError?.message?.includes('token')) {
                toast.error('Authentication error. Please try again.');
            } else {
                toast.error('Login failed. Please try again.');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await handleLogin(email, password);
        setIsSubmitting(false);
    };

    return (
        <div className="p-8 rounded-2xl backdrop-blur-sm bg-background/50 border border-sc/10">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold mb-2 relative group">
                    <span className="absolute -inset-1 bg-gradient-to-r from-sc-600/30 via-indigo-500/30 to-purple-500/30 blur-xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse"></span>
                    <span className="relative inline-block text-3xl font-bold mb-2 text-foreground">
                        TickFlo Admin
                    </span>
                    <span className="absolute -inset-0.5 bg-gradient-to-r from-sc-500/20 to-purple-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                </h2>
                <p className="text-foreground/80 flex flex-col items-center space-y-1">
                    <span className="relative group cursor-default">
                        <span className="absolute -inset-1 bg-gradient-to-r from-sc-600/20 to-purple-600/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                        <span className="relative inline-block">Super Admin Dashboard</span>
                    </span>
                    <span className="text-xs text-foreground/50">
                        Secure access to system management
                    </span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    icon={<Mail className="text-foreground/60" size={18} />}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <div className="relative">
                    <FormInput
                        icon={<Lock className="text-foreground/60" size={18} />}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground focus:outline-none transition-colors z-10"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="flex justify-end">
                    <Link href="#" className="text-sm text-foreground/80 hover:text-foreground transition-colors">
                        Forgot password?
                    </Link>
                   
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className='w-full cursor-pointer font-semibold'
                >
                    {isSubmitting ? 'Signing in...' : 'Access Dashboard'}
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-foreground/80">
                Authorized personnel only
            </p>
        </div>
    );
};

// Export as default components
const LoginPage = {
    LoginForm,
    ImageBackground
};

export default LoginPage;