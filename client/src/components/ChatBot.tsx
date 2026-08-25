import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Order, Product } from "../types";
import { formatInr } from "../lib/format";
import { FiMessageCircle, FiX, FiSend } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

interface Message {
  from: "bot" | "user";
  content: ReactNode;
}

const WHATSAPP = "https://wa.me/919848918992";

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "Delivery charges & time?",
    a: (
      <>
        Delivery is <b>FREE on orders over ₹999</b>; below that a flat ₹79 applies. After you
        order, our team confirms the delivery timing for your pincode by call or WhatsApp.
      </>
    ),
  },
  {
    q: "How do I pay?",
    a: (
      <>
        We accept <b>UPI</b>. After placing your order you'll see a QR code — scan it with any
        UPI app (GPay, PhonePe, Paytm), pay, and enter the transaction ID (UTR) on the same
        page. We pack your order as soon as the payment is confirmed.
      </>
    ),
  },
  {
    q: "Are the products original?",
    a: (
      <>
        Yes — everything is sourced directly at the origin: Afghan anjeer, Kashmiri saffron and
        walnuts, Coorg and Chikmagalur spices and coffee. We are FSSAI registered
        (No. 23626443000038), shown at the bottom of every page.
      </>
    ),
  },
  {
    q: "Bulk / wholesale orders?",
    a: (
      <>
        We'd love to help with bulk and gifting orders! Message us on WhatsApp or call{" "}
        <a href="tel:+919848918992" className="font-semibold text-gold-700 underline">
          +91 98489 18992
        </a>{" "}
        and we'll share wholesale pricing.
      </>
    ),
  },
];

function OrderStatusLookup({ onResult }: { onResult: (node: ReactNode) => void }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(e: FormEvent) {
    e.preventDefault();
    const num = orderNumber.trim().toUpperCase();
    if (!num) return;
    setBusy(true);
    try {
      const res = await api.get<Order>(`/orders/${num}`);
      const o = res.data;
      onResult(
        <>
          Order <b>{o.orderNumber}</b> — status: <b>{o.status}</b>
          {o.paymentMethod === "UPI" && (
            <>
              , payment:{" "}
              <b>{o.paymentStatus === "PAID" ? "received ✓" : "awaiting confirmation"}</b>
            </>
          )}
          . Total {formatInr(o.totalInr)}. Questions? Ping us on WhatsApp with your order
          number.
        </>
      );
    } catch {
      onResult(
        <>
          I couldn't find an order with that number. Double-check it (it looks like
          MFZ26081234) or message us on WhatsApp and we'll trace it.
        </>
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={lookup} className="mt-2 flex gap-2">
      <input
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="e.g. MFZ2608241234"
        className="min-w-0 flex-1 rounded-full border border-gold-500/50 bg-white px-3 py-1.5 text-xs text-brown-900 focus:border-gold-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy}
        aria-label="Check order status"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brown-950 text-gold-300 hover:bg-brown-900 disabled:opacity-60"
      >
        <FiSend className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      content: (
        <>
          Welcome to <b>Mehfuz</b>! 🌰 I can help with delivery, payment, order status, and
          bulk enquiries — tap a question below.
        </>
      ),
    },
  ]);
  const [showTracker, setShowTracker] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  // Plain-text transcript of the free-form AI exchange (sent as context).
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ aiEnabled: boolean }>("/config/chat").then((res) => setAiEnabled(res.data.aiEnabled)).catch(() => {});
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, showTracker, thinking]);

  // Catalog cache for local (no-AI) answers.
  const productsRef = useRef<Product[] | null>(null);
  async function getProducts(): Promise<Product[]> {
    if (productsRef.current) return productsRef.current;
    try {
      const res = await api.get<Product[]>("/catalog/products");
      productsRef.current = res.data;
    } catch {
      productsRef.current = [];
    }
    return productsRef.current;
  }

  function whatsAppOffer(text: string): ReactNode {
    return (
      <a
        href={`${WHATSAPP}?text=${encodeURIComponent(`Hello Mehfuz! ${text}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#1fb857]"
      >
        <FaWhatsapp className="h-3 w-3" />
        Send this on WhatsApp
      </a>
    );
  }

  async function answerLocally(
    text: string
  ): Promise<{ node: ReactNode; openTracker?: boolean }> {
    const t = text.toLowerCase();
    const has = (...words: string[]) => words.some((w) => t.includes(w));

    // Product / price questions — match against the live catalog.
    if (!has("deliver", "shipping", "charge") || has("price", "cost", "rate", "kitna", "how much")) {
      const products = await getProducts();
      const matches = products.filter((p) => {
        const name = p.name.toLowerCase();
        if (t.includes(name)) return true;
        return name
          .split(/\s+/)
          .some((w) => w.length > 3 && t.includes(w));
      });
      if (matches.length > 0) {
        const shown = matches.slice(0, 3);
        return {
          node: (
            <>
              {shown.map((p) => (
                <div key={p.id} className="mb-1.5 last:mb-0">
                  <Link
                    to={`/product/${p.slug}`}
                    className="font-semibold text-gold-700 underline"
                  >
                    {p.name}
                  </Link>
                  :{" "}
                  {p.variants
                    .map(
                      (v) =>
                        `${v.label} — ${formatInr(v.priceInr)}${v.stock === 0 ? " (out of stock)" : ""}`
                    )
                    .join(", ")}
                </div>
              ))}
              <div className="mt-1 text-brown-500">Tap a product to see details and order.</div>
            </>
          ),
        };
      }
    }

    if (has("deliver", "shipping", "charge", "kab", "how long", "time")) {
      return { node: FAQS[0].a };
    }
    if (has("pay", "upi", "qr", "cod", "cash")) {
      return { node: FAQS[1].a };
    }
    if (has("original", "genuine", "quality", "fssai", "pure")) {
      return { node: FAQS[2].a };
    }
    if (has("bulk", "wholesale", "gift", "hamper", "corporate")) {
      return { node: FAQS[3].a };
    }
    if (has("order", "track", "status", "where is")) {
      return {
        node: <>Sure — enter your order number below (it looks like MFZ26081234):</>,
        openTracker: true,
      };
    }
    if (has("hi", "hello", "salam", "hey", "namaste")) {
      return {
        node: (
          <>
            Hello! 🌰 Ask me about any product's price, delivery, payment, or your order —
            or tap a question below.
          </>
        ),
      };
    }

    return {
      node: (
        <>
          I'm not sure about that one — our team on WhatsApp can help right away:
          <br />
          {whatsAppOffer(text)}
        </>
      ),
    };
  }

  async function sendFreeform(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft("");
    setShowTracker(false);
    setMessages((prev) => [...prev, { from: "user", content: text }]);

    // Without the AI configured, answer locally: product prices from the live
    // catalog, FAQ keyword matches, and a WhatsApp *offer* (never auto-open).
    if (!aiEnabled) {
      const answer = await answerLocally(text);
      setMessages((prev) => [...prev, { from: "bot", content: answer.node }]);
      if (answer.openTracker) setShowTracker(true);
      return;
    }
    historyRef.current = [...historyRef.current, { role: "user" as const, content: text }].slice(-10);
    setThinking(true);
    try {
      const res = await api.post<{ reply: string }>("/chat", { messages: historyRef.current });
      historyRef.current = [...historyRef.current, { role: "assistant" as const, content: res.data.reply }].slice(-10);
      setMessages((prev) => [...prev, { from: "bot", content: res.data.reply }]);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "I couldn't reply just now — please tap a question below or use WhatsApp.";
      setMessages((prev) => [...prev, { from: "bot", content: msg }]);
    } finally {
      setThinking(false);
    }
  }

  function ask(q: string, a: ReactNode) {
    setShowTracker(false);
    setMessages((prev) => [...prev, { from: "user", content: q }, { from: "bot", content: a }]);
  }

  function askOrderStatus() {
    setMessages((prev) => [
      ...prev,
      { from: "user", content: "Where is my order?" },
      {
        from: "bot",
        content: <>Sure — enter your order number below (it's in your confirmation email and on the order page):</>,
      },
    ]);
    setShowTracker(true);
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brown-950 text-gold-300 shadow-xl ring-2 ring-gold-500/60 transition hover:scale-105 hover:bg-brown-900"
      >
        {open ? <FiX className="h-6 w-6" /> : <FiMessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <div
        aria-hidden={!open}
        className={`fixed bottom-24 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gold-500/40 bg-cream-50 shadow-2xl transition-all duration-300 ease-out font-roboto ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 bg-brown-950 px-4 py-2.5">
          <img
            src="/images/logo.webp?v=3"
            alt="MEHFUZ"
            className="h-11 w-auto object-contain"
          />
          <div>
            <div className="font-serif text-sm font-bold text-gold-300">Mehfuz Assistant</div>
            <div className="text-[10px] text-cream-100/70">Usually replies instantly</div>
          </div>
        </div>

        <div ref={bodyRef} className="max-h-80 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  m.from === "user"
                    ? "rounded-br-sm bg-brown-950 text-cream-100"
                    : "rounded-bl-sm border border-gold-500/30 bg-white text-brown-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {showTracker && (
            <OrderStatusLookup
              onResult={(node) => {
                setShowTracker(false);
                setMessages((prev) => [...prev, { from: "bot", content: node }]);
              }}
            />
          )}
          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-gold-500/30 bg-white px-3.5 py-2 text-xs text-brown-500">
                typing…
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gold-500/30 bg-white px-3 py-2.5">
          <form onSubmit={sendFreeform} className="mb-2 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                aiEnabled ? "Ask me anything about our products…" : "Type your message…"
              }
              maxLength={500}
              className="min-w-0 flex-1 rounded-full border border-gold-500/50 bg-cream-50 px-3.5 py-2 text-xs text-brown-900 focus:border-gold-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={thinking || !draft.trim()}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full bg-brown-950 text-gold-300 hover:bg-brown-900 disabled:opacity-50"
            >
              <FiSend className="h-3.5 w-3.5" />
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {FAQS.map((f) => (
              <button
                key={f.q}
                onClick={() => ask(f.q, f.a)}
                className="rounded-full border border-gold-500/50 bg-cream-50 px-3 py-1 text-[11px] font-semibold text-brown-800 transition hover:border-gold-500 hover:bg-cream-100"
              >
                {f.q}
              </button>
            ))}
            <button
              onClick={askOrderStatus}
              className="rounded-full border border-gold-500/50 bg-cream-50 px-3 py-1 text-[11px] font-semibold text-brown-800 transition hover:border-gold-500 hover:bg-cream-100"
            >
              Where is my order?
            </button>
          </div>
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent("Hello Mehfuz! I have a question.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-2 text-xs font-bold text-white hover:bg-[#1fb857]"
          >
            <FaWhatsapp className="h-3.5 w-3.5" />
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
