"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="font-sans antialiased min-h-screen flex flex-col items-center justify-center text-center px-4 bg-base-100 text-base-content">
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-error" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Critical Error</h1>
        <p className="text-xl text-base-content/70 mb-8 max-w-md">
          A critical system error occurred. We are working to resolve this as quickly as possible.
        </p>
        <button onClick={() => reset()} className="btn btn-primary">
          Restart Application
        </button>
      </body>
    </html>
  );
}
