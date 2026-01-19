import { Coffee } from "lucide-react";

const Header = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#F89800] via-[#FFB74D] to-[#F89800] py-20 md:py-32">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-red-600/10 blur-3xl animate-pulse" />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        {/* Main Branding */}
        <div className="mb-8 flex flex-col items-center justify-center animate-fade-in-up">
          <div className="mb-6 p-5 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Coffee className="h-16 w-16 text-white md:h-20 md:w-20 drop-shadow-lg" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl italic">
            AJABO
          </h1>
          <div className="mt-2 h-2 w-24 bg-red-600 rounded-full shadow-lg" />
        </div>

        {/* Tagline */}
        <p className="mx-auto max-w-lg text-xl md:text-2xl text-white font-bold drop-shadow-md">
          Mazzali va sifatli taomlar maskani 🍔✨
        </p>

        {/* Scrolling indicator or decorative dot */}
        <div className="mt-12 animate-bounce">
          <div className="mx-auto h-1.5 w-1.5 rounded-full bg-white" />
        </div>
      </div>
    </header>
  );
};

export default Header;
