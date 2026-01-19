import { MapPin } from "lucide-react";

const MapSection = () => {
  return (
    <section className="border-t border-border bg-secondary/30 py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center justify-center rounded-full bg-accent/10 p-3">
            <MapPin className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-[#E21A1A] md:text-3xl">
            Bizning manzil
          </h2>
          <p className="mt-2 text-lg font-medium text-[#4A4A4A]">
            Shovot tumani Kinoteatr
          </p>
        </div>

        {/* Map container */}
        <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2975.244302636181!2d60.29180767556531!3d41.65500087130234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDM5JzE4LjAiTiA2MMKwMTcnMzguNCJF!5e0!3m2!1sen!2s!4v1705670000000"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ajabo Cafe joylashuvi"
            className="w-full"
          />
        </div>

        {/* Additional info */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-[#666666]">
          <span className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            Ish vaqti: 09:00 - 23:00
          </span>
        </div>
      </div>
    </section>
  );
};

export default MapSection;
