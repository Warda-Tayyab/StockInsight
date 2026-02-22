import Login from '@/components/screens/Login';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12">
      <Login.ImageBackground imageUrl="/images/dashboard.png" />
      <div className="relative z-20 w-full max-w-md animate-fadeIn">
        <Login.LoginForm />
      </div>
      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-20">
        © 2025 TickFlo. All rights reserved.
      </footer>
    </div>
  );
}
