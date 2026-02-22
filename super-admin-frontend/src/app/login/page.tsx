'use client';

import LoginPage from "@/components/screens/Login";

function App() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12">
      <LoginPage.ImageBackground imageUrl="/images/dashboard.png" />

      <div className="relative z-20 w-full max-w-md animate-fadeIn">
        <LoginPage.LoginForm />
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-20">
        © 2025 TickFlo. All rights reserved.
      </footer>
    </div>
  );
}

export default App;