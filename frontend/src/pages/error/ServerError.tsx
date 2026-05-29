import React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "../../components/common/Button";

export const ServerError: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500 mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-6xl font-black mb-2 text-red-500">500</h1>
        <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-150">Kitchen is Temporarily Closed</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          Our servers are facing some issues right now. Our technical chefs are working to restore order. Please try again in a few minutes.
        </p>
        <Button onClick={handleRetry} variant="primary" className="w-full">
          Try Again
        </Button>
      </div>
    </div>
  );
};
export default ServerError;
