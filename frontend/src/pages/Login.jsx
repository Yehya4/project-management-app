import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {}
      <div className="absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_35%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] [background-size:36px_36px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/80 shadow-2xl shadow-slate-200/60 backdrop-blur-xl lg:grid-cols-2">

          {}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-100 via-indigo-100 to-slate-50 p-10 text-slate-800">
            <div>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
                <span className="text-2xl font-black tracking-tight text-blue-700">AP</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-2">
                Bienvenue sur Auto Projects Workspace
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                Une interface claire, sécurisée et moderne pour accéder rapidement à votre espace de travail.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Connexion sécurisée</p>
                    <p className="text-xs text-slate-500">
                      Vos accès sont protégés et vérifiés.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Professional access portal
              </p>
            </div>
          </div>

          {}
          <div className="bg-white/90 px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
                  <span className="text-2xl font-black tracking-tight">AP</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Auto Projects
                </h1>
                <p className="mt-1 text-sm uppercase tracking-[0.2em] text-slate-400">
                  Workspace
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  Connexion
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Entrez vos identifiants pour accéder à votre espace en toute sécurité.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Adresse email
                  </label>
                  <div className="group flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@mail.com"
                      required
                      className="w-full bg-transparent px-3 py-3.5 text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <div className="group flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                    <Lock className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-600" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-transparent px-3 py-3.5 text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 transition hover:text-slate-600"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Se souvenir de moi
                  </label>

                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                    Accès sécurisé
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="text-center text-sm text-slate-500">
                  Interface professionnelle, lisible et optimisée pour une connexion rapide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;