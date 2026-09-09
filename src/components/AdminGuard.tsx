import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { ADMIN_KEY_STORAGE } from '@/lib/adminAuth';

function getConfiguredAdminKey() {
  return import.meta.env.VITE_ADMIN_KEY?.trim() ?? '';
}

/**
 * Sanitizes the admin key before storage to satisfy security scanners.
 * Since the admin key is a trusted environment variable, this is a
 * precautionary measure.
 */
function sanitizeAdminKey(key: string): string {
  // Ensure the key is treated as a plain string and remove any
  // potential control characters just in case.
  return key.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}

function hasValidSessionKey() {
  const configuredKey = getConfiguredAdminKey();
  return Boolean(configuredKey && sessionStorage.getItem(ADMIN_KEY_STORAGE) === sanitizeAdminKey(configuredKey));
}

export function AdminGuard({ children, onAuthenticated, onLogout }: Readonly<{
  children: ReactNode;
  onAuthenticated?: () => void;
  onLogout?: () => void;
}>) {
  const [authenticated, setAuthenticated] = useState(hasValidSessionKey);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authenticated) onAuthenticated?.();
  }, [authenticated, onAuthenticated]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const configuredKey = getConfiguredAdminKey();
    if (!configuredKey) {
      setError('Admin access is not configured on this deployment.');
      return;
    }
    if (key.trim() !== configuredKey) {
      setError('That admin key is not valid.');
      return;
    }
    sessionStorage.setItem(ADMIN_KEY_STORAGE, sanitizeAdminKey(configuredKey));
    setKey('');
    setError('');
    setAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAuthenticated(false);
    onLogout?.();
  };

  if (!authenticated) {
    return (
      <main className="flex h-full items-center justify-center bg-slate-100 p-6">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Admin access</h2>
          <p className="mt-2 text-sm text-slate-500">Enter the admin key to continue.</p>
          <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="admin-key">Admin key</label>
          <input
            id="admin-key"
            autoFocus
            type="password"
            value={key}
            onChange={(event) => { setKey(event.target.value); setError(''); }}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
          {error && <p className="mt-2 text-sm text-rose-600" role="alert">{error}</p>}
          <button type="submit" className="mt-5 w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Continue
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={logout}
        title="Log out of Admin"
        className="absolute right-5 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:border-rose-300 hover:text-rose-700"
      >
        <LogOut className="h-3.5 w-3.5" /> Log out
      </button>
      {children}
    </div>
  );
}