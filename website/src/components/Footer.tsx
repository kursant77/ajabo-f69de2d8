import { Coffee, MapPin, Phone, Clock, Instagram, Send } from "lucide-react";
import { useSupabaseSettings } from "@/hooks/useSupabaseSettings";

const Footer = () => {
  const { settings } = useSupabaseSettings();

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Coffee className="h-6 w-6" />
              <span className="font-display text-2xl font-bold">{settings.cafe_name}</span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              {settings.description}
            </p>
          </div>

          {/* Address */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <MapPin className="h-5 w-5 text-[#F89800]" />
              Manzil
            </h3>
            <p className="text-sm text-primary-foreground/70">
              {settings.address}
            </p>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5 text-[#F89800]" />
              Ish vaqti
            </h3>
            <p className="mb-4 text-sm text-primary-foreground/70">
              Har kuni: {settings.open_time} - {settings.close_time}
            </p>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#F89800]" />
              <a
                href={`tel:${settings.phone.replace(/\s/g, '')}`}
                className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                {settings.phone}
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Ijtimoiy tarmoqlar</h3>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/ajabocafe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-[#F89800] hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://t.me/ajabocafe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-[#F89800] hover:text-white"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} {settings.cafe_name}. Barcha huquqlar himoyalangan.
          </p>
          <p className="mt-2 text-xs text-white/30 font-bold uppercase tracking-widest">
            Developed by Tricorp Group
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
