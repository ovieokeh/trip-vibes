"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { syncUserToDatabase } from "@/lib/auth-actions";
import { useAuth } from "./AuthProvider";
import { useTranslations } from "next-intl";
import { X, Mail, Lock, Sparkles, UserCircle, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  message?: string;
  showGuestOption?: boolean; // Show "Continue as Guest" for save flow
}

export function AuthModal({ isOpen, onClose, onSuccess, title, message, showGuestOption = false }: AuthModalProps) {
  const t = useTranslations("Auth");
  const { user, isAnonymous, refreshCredits } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        // Check if we have an anonymous user to upgrade
        if (user && isAnonymous) {
          // Convert anonymous user to real account
          const { error } = await supabase.auth.updateUser({
            email,
            password,
          });

          if (error) {
            if (error.message.includes("email")) {
              setError(t("errors.emailInUse"));
            } else {
              setError(error.message);
            }
            setLoading(false);
            return;
          }

          // For upgrades, we also want to show verification message if configured
          setVerificationSent(true);
          setLoading(false);
          return;
        } else {
          // No anonymous user - create a new account
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) {
            if (error.message.includes("already registered")) {
              setError(t("errors.emailInUse"));
            } else {
              setError(error.message);
            }
            setLoading(false);
            return;
          }

          // If session is null, it means email verification is required
          if (data.user && !data.session) {
            setVerificationSent(true);
            setLoading(false);
            return;
          }
        }

        // Sync to database with updated info
        await syncUserToDatabase();
        await refreshCredits();
        onSuccess?.();
        onClose();
      } else {
        // Sign in to existing account
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(t("errors.invalidCredentials"));
          setLoading(false);
          return;
        }

        await syncUserToDatabase();
        await refreshCredits();
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.error("Anonymous sign-in failed:", signInError);
          setError(signInError.message);
          setLoading(false);
          return;
        }

        // Wait a moment for session cookies to propagate
        await new Promise((resolve) => setTimeout(resolve, 500));

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.error("Session not created after anonymous sign-in");
          setError(t("errors.generic"));
          setLoading(false);
          return;
        }
      }

      await syncUserToDatabase();
      await refreshCredits();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Guest continue error:", err);
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (verificationSent) {
    return (
      <div className="modal modal-open z-50">
        <div className="modal-box max-w-sm text-center">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-success" />
          </div>

          <h3 className="font-bold text-xl mb-2">{t("checkEmail")}</h3>
          <p className="text-base-content/70 text-sm mb-6">{t("verificationSentMessage")}</p>

          <button className="btn btn-primary w-full" onClick={onClose}>
            {t("close")}
          </button>
        </div>
        <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
      </div>
    );
  }

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-sm">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose} disabled={loading}>
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-xl">{title || t("title")}</h3>
          <p className="text-base-content/70 text-sm mt-2">{message || t("description")}</p>
        </div>

        {/* Guest Option */}
        {showGuestOption && (
          <>
            <button onClick={handleGuestContinue} disabled={loading} className="btn btn-outline w-full mb-4 gap-2">
              <UserCircle className="w-5 h-5" />
              {t("continueAsGuest")}
            </button>
            <div className="divider text-xs opacity-60 my-4">{t("or")}</div>
          </>
        )}

        {/* Tab Switcher */}
        <div className="tabs tabs-boxed mb-6 grid grid-cols-2">
          <button className={`tab ${mode === "signup" ? "tab-active" : ""}`} onClick={() => setMode("signup")}>
            {t("signUp")}
          </button>
          <button className={`tab ${mode === "signin" ? "tab-active" : ""}`} onClick={() => setMode("signin")}>
            {t("signIn")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="input input-bordered flex items-center gap-2">
              <Mail className="w-4 h-4 opacity-70" />
              <input
                type="email"
                className="grow"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </label>
          </div>

          <div className="form-control">
            <label className="input input-bordered flex items-center gap-2">
              <Lock className="w-4 h-4 opacity-70" />
              <input
                type={showPassword ? "text" : "password"}
                className="grow"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4 opacity-70" /> : <Eye className="w-4 h-4 opacity-70" />}
              </button>
            </label>
          </div>

          {error && (
            <div className="alert alert-error py-2 text-sm">
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : mode === "signup" ? (
              t("createAccount")
            ) : (
              t("signInButton")
            )}
          </button>
        </form>

        {mode === "signup" && <p className="text-center text-xs text-base-content/50 mt-4">{t("signUpBonus")}</p>}

        {showGuestOption && <p className="text-center text-xs text-base-content/50 mt-4">{t("guestNote")}</p>}
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}
