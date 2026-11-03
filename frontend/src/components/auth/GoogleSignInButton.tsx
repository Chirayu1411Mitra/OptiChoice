import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityApi {
  initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(element: HTMLElement, options: { theme: "outline"; size: "large"; shape: "rectangular"; text: "continue_with"; width: number }): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

let googleScript: Promise<void> | undefined;

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleScript) return googleScript;

  googleScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.accounts.id ? resolve() : reject(new Error("Google sign-in did not initialize."));
    script.onerror = () => reject(new Error("Google sign-in couldn't load. Check your internet connection and try again."));
    document.head.appendChild(script);
  });
  return googleScript;
}

export function GoogleSignInButton({ onCredential, onError }: { onCredential: (credential: string) => Promise<void>; onError: (message: string) => void }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const credentialHandler = useRef(onCredential);
  const errorHandler = useRef(onError);
  const [loadError, setLoadError] = useState<string | null>(null);
  const clientId = import.meta.env["VITE_GOOGLE_CLIENT_ID"]?.trim();

  useEffect(() => { credentialHandler.current = onCredential; }, [onCredential]);
  useEffect(() => { errorHandler.current = onError; }, [onError]);

  useEffect(() => {
    if (!clientId || !elementRef.current) return;
    let active = true;
    void loadGoogleIdentity().then(() => {
      if (!active || !elementRef.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            errorHandler.current("Google sign-in didn't return a credential. Please try again.");
            return;
          }
          void credentialHandler.current(response.credential).catch((error: unknown) => {
            errorHandler.current(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
          });
        },
      });
      window.google.accounts.id.renderButton(elementRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: Math.min(elementRef.current.clientWidth || 360, 400),
      });
    }).catch((error: unknown) => {
      if (!active) return;
      const message = error instanceof Error ? error.message : "Google sign-in couldn't load.";
      setLoadError(message);
      errorHandler.current(message);
    });
    return () => { active = false; };
  }, [clientId]);

  if (!clientId) {
    return <p className="text-center text-xs text-muted-foreground">Google sign-in is available after its OAuth client ID is configured.</p>;
  }

  return (
    <div className="space-y-2">
      <div ref={elementRef} className="flex min-h-10 justify-center" />
      {loadError && <p className="text-center text-xs text-destructive" role="status">{loadError}</p>}
    </div>
  );
}
