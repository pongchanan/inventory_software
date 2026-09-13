"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; hosted_domain?: string }) => void;
      renderButton: (element: HTMLElement, options: { theme: string; size: string; width?: number; text?: string }) => void;
    } } };
  }
}

export function GoogleSignIn({ onSuccess }: { onSuccess?: () => void }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const buttonRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  function renderButton() {
    if (!clientId || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId, hosted_domain: "kmitl.ac.th",
      callback: async ({ credential }) => {
        if (!credential) return setError("Google did not return a sign-in token.");
        try { setError(""); await loginWithGoogle(credential); onSuccess?.(); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Google sign-in failed."); }
      },
    });
    buttonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(buttonRef.current, { theme: "outline", size: "large", width: 360, text: "continue_with" });
  }
  if (!clientId) return null;
  return <div className="space-y-2"><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={renderButton} /><div ref={buttonRef} className="min-h-10" />{error && <p className="text-sm text-red-600" role="alert">{error}</p>}</div>;
}
