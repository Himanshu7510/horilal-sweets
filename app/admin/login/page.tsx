import { redirect } from 'next/navigation';
import { adminExists, currentAdmin } from '@/lib/auth';
import { getSetting } from '@/lib/settings';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Admin sign in', robots: { index: false } };

export default async function LoginPage() {
  if (await currentAdmin()) redirect('/admin');
  const [exists, site] = await Promise.all([adminExists(), getSetting('site')]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="font-display text-3xl text-brand">{site.brandName}</div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">{exists ? 'Sign in to your admin panel' : 'Create your admin account'}</h1>
        {!exists && (
          <p className="mt-1 text-sm text-gray-600">This is the first visit to your admin panel. Choose the email and password you’ll use to manage the store.</p>
        )}
        <LoginForm setup={!exists} />
      </div>
    </div>
  );
}
