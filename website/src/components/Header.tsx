import { Coffee, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  compact?: boolean;
  title?: string;
}

const Header = ({ userName, onLogout, compact, title = "AJABO" }: HeaderProps) => {
  return (
    <header className={cn(
      "relative overflow-hidden bg-primary transition-all duration-500",
      compact ? "py-6 md:py-8" : "py-12 md:py-20"
    )}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* User Profile Section (Floating) */}
      {userName && (
        <div className={cn(
          "absolute z-20 animate-fade-in",
          compact ? "top-1/2 -translate-y-1/2 right-4 md:right-12" : "top-4 right-4"
        )}>
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-1.5 pl-3.5 backdrop-blur-md border border-white/20 shadow-lg">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">Profil</span>
              <span className="text-xs font-bold text-white line-clamp-1">Salom, {userName}!</span>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/20 text-white">
              <User className="h-4 w-4" />
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-100 hover:bg-red-500/30 transition-colors border border-red-400/20"
                title="Chiqish"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className={cn(
        "container relative z-10 mx-auto px-4",
        compact ? "flex items-center justify-start gap-6" : "text-center"
      )}>
        {/* Main Branding */}
        <div className={cn(
          "flex items-center animate-fade-in-up",
          compact ? "flex-row gap-4" : "flex-col justify-center mb-6"
        )}>
          <div className={cn(
            "rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
            compact ? "p-3" : "p-4 mb-4"
          )}>
            <Coffee className={cn(
              "text-white drop-shadow-md",
              compact ? "h-6 w-6" : "h-10 w-10 md:h-12 md:w-12"
            )} />
          </div>

          <div className={compact ? "text-left" : "text-center"}>
            <h1 className={cn(
              "font-black text-white tracking-tighter drop-shadow-xl italic leading-none uppercase",
              compact ? "text-3xl" : "text-5xl md:text-7xl"
            )}>
              {title}
            </h1>
            {!compact && <div className="mt-1 mx-auto h-1.5 w-16 bg-[#E21A1A] rounded-full shadow-md" />}
          </div>
        </div>

        {/* Tagline - Hidden in compact mode */}
        {!compact && (
          <>
            <p className="mx-auto max-w-lg text-lg md:text-xl text-white font-bold drop-shadow-sm opacity-90 leading-tight">
              Mazzali va sifatli taomlar maskani <span className="inline-block hover:animate-bounce">🍔✨</span>
            </p>

            {/* Decorative dot */}
            <div className="mt-8 opacity-50">
              <div className="mx-auto h-1 w-1 rounded-full bg-white" />
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
