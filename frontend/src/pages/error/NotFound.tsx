import React from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "../../components/common/Button";

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="inline-flex p-4 rounded-full bg-orange-500/10 text-orange-500 mb-6">
          <Search className="w-10 h-10" />
        </div>
        <h1 className="text-6xl font-black mb-2 text-orange-500">404</h1>
        <h2 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-150">Lost in Taste?</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          The page you are looking for has taken a break or doesn't exist. Let's get you back to the main kitchen.
        </p>
        <Link to="/" className="w-full block">
          <Button variant="primary" className="w-full">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
export default NotFound;
