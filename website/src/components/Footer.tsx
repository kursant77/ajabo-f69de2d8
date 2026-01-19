import { Coffee, MapPin, Phone, Clock, Instagram, Send } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Coffee className="h-6 w-6" />
              <span className="font-display text-2xl font-bold">Ajabo</span>
            </div>
            <p className="text-sm text-primary-foreground/70">
              Eng yaxshi qahva va shirinliklar uchun joy. Sizni kutib qolamiz!
            </p>
          </div>

          {/* Address */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <MapPin className="h-5 w-5 text-accent" />
              Manzil
            </h3>
            <p className="text-sm text-primary-foreground/70">
              Toshkent shahar, Chilonzor tumani,
              <br />
              Bunyodkor ko'chasi, 15-uy
            </p>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5 text-accent" />
              Ish vaqti
            </h3>
            <p className="mb-4 text-sm text-primary-foreground/70">
              Har kuni: 09:00 - 22:00
            </p>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" />
              <a
                href="tel:+998901234567"
                className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                +998 90 123 45 67
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 font-semibold">Ijtimoiy tarmoqlar</h3>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/ajabocafe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-all hover:bg-accent hover:text-accent-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://t.me/ajabocafe"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 transition-all hover:bg-accent hover:text-accent-foreground"
                aria-label="Telegram"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-center">
          <p className="text-sm text-primary-foreground/50">
            © 2024 Ajabo Cafe. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
