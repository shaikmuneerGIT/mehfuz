import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatInr } from "../lib/format";

interface ShopQuote {
  shippingEnabled: boolean;
  freeAbove: number;
}

/**
 * Slim scrolling "flash" strip for the home screen. The free-delivery
 * threshold is read live from the shipping settings, so changing it in the
 * admin panel updates the strip automatically.
 */
export function AnnouncementFlash() {
  const [freeAbove, setFreeAbove] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<ShopQuote>("/config/shop")
      .then((res) => setFreeAbove(res.data.shippingEnabled ? res.data.freeAbove : 0))
      .catch(() => {});
  }, []);

  const items = [
    freeAbove && freeAbove > 0
      ? `🚚 FREE delivery on orders above ${formatInr(freeAbove)}`
      : "🚚 FREE delivery on all orders",
    "🌰 Sourced directly at the origin — Afghanistan, Kashmir, Coorg",
    "✅ FSSAI-registered premium quality",
    "💬 Order help on WhatsApp: +91 98489 18992",
  ];
  // Duplicate the sequence so the marquee loops without a visible gap.
  const track = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-gold-500/50 bg-gradient-to-r from-brown-950 via-brown-900 to-brown-950 py-2 select-none">
      <div className="ai-marquee-track flex w-max gap-12">
        {track.map((text, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-xs font-semibold tracking-wide text-gold-300 font-roboto"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
