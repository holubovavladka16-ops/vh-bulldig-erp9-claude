"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database.types";
import SessionTimeoutModal from "@/components/SessionTimeoutModal";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minut
const WARNING_BEFORE_MS = 60 * 1000; // upozornění 60 s před odhlášením

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearInactivityTimers = () => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
  };

  const signOut = useCallback(async () => {
    clearInactivityTimers();
    await supabase.auth.signOut();
    setProfile(null);
    // Vyčištění citlivých dat aplikace uložených v paměti prohlížeče.
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
    // replace (ne push), aby tlačítko Zpět nevrátilo na chráněnou stránku.
    router.replace("/prihlaseni");
    router.refresh();
  }, [router, supabase]);

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimers();
    setShowTimeoutWarning(false);
    warningTimer.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS);
    logoutTimer.current = setTimeout(() => {
      signOut();
    }, INACTIVITY_LIMIT_MS);
  }, [signOut]);

  // Načtení profilu (role, oprávnění, firma) po přihlášení.
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (isMounted) {
        setProfile(data ? (data as unknown as Profile) : null);
        setLoading(false);
      }
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sledování aktivity uživatele pro automatické odhlášení po 15 minutách.
  useEffect(() => {
    const devAutoLogin =
      process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" ||
      process.env.NODE_ENV === "development";

    if (!profile || devAutoLogin) {
      clearInactivityTimers();
      return;
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearInactivityTimers();
    };
  }, [profile, resetInactivityTimer]);

  return (
    <AuthContext.Provider value={{ profile, loading, signOut }}>
      {children}
      {showTimeoutWarning && (
        <SessionTimeoutModal
          onContinue={() => resetInactivityTimer()}
          onLogout={() => signOut()}
        />
      )}
    </AuthContext.Provider>
  );
}
