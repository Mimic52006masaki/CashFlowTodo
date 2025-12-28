'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">CashFlowTodo</h1>
      <p>Welcome, {user.email}!</p>
      <button onClick={handleLogout} className="mt-4 bg-red-500 text-white p-2 rounded">Logout</button>
    </main>
  );
}