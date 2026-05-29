import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const SCRIPT_ID = "google-gsi-client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError?: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = "continue_with",
}) => {
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) {
      setScriptError(true);
      return;
    }

    const init = () => {
      if (!window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response: { credential?: string }) => {
          if (response.credential) onSuccess(response.credential);
          else onError?.("Google sign-in was cancelled");
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text,
        width: btnRef.current.offsetWidth || 320,
        shape: "pill",
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", init);
      return () => existing.removeEventListener("load", init);
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);
  }, [onSuccess, onError, text]);

  if (!CLIENT_ID || scriptError) {
    return (
      <p className="text-center text-[11px] text-slate-400">
        Google sign-in: set <code className="text-orange-500">VITE_GOOGLE_CLIENT_ID</code> in frontend .env
      </p>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div ref={btnRef} className="w-full flex justify-center min-h-[44px]" />
      {!ready && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading Google...
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
