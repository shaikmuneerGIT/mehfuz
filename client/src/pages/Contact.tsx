import { useState, type FormEvent } from "react";
import { PageBanner } from "../components/PageBanner";
import {
  FiPhoneCall,
  FiMail,
  FiSend,
  FiCheckCircle,
  FiZap,
  FiShield,
  FiTruck,
  FiAward,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    inquiryType: "Retail Order",
    message: "",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen parchment font-roboto">
      {/* 200px Height Full-Width Header Banner */}
      <PageBanner
        image="/images/hero_banner_1.webp"
        title="Contact Us"
        subtitle="Get in touch with our team for bulk orders, support, and inquiries."
        breadcrumbs={[{ label: "Contact Us" }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 font-roboto">
        {/* Quick Response Banner Badge */}
        <div className="mb-10 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-brown-950 px-5 py-2 text-xs sm:text-sm font-roboto text-cream-100 shadow-md">
            <FiZap className="h-4 w-4 text-gold-400 animate-pulse" />
            <span className="font-roboto text-cream-100">
              <strong className="text-gold-300 font-roboto">Quick Response Guarantee:</strong> We reply to all inquiries within 2 hours during business hours.
            </span>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 font-roboto">
          {/* Left Column: Direct Contact & Info Cards */}
          <div className="lg:col-span-5 space-y-6 font-roboto">
            {/* Phone & WhatsApp Card */}
            <div className="rounded-2xl border border-gold-500/50 bg-cream-50/95 p-6 sm:p-8 shadow-sm font-roboto">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/20 text-gold-700">
                  <FiPhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-brown-950">Direct Phone & Orders</h3>
                  <p className="font-roboto text-xs text-brown-600">Speak directly with our harvest team</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 font-roboto">
                <div className="rounded-xl border border-gold-500/30 bg-white p-4 font-roboto">
                  <p className="text-[11px] font-medium text-brown-500 uppercase tracking-wider font-roboto mb-2">Order Line Numbers</p>
                  <div className="sm:items-center gap-2.5 sm:gap-4 text-brown-950 font-roboto">
                    <a
                      href="tel:+919848918992"
                      className="font-roboto text-base font-bold text-brown-950 hover:text-gold-700 transition-colors flex items-center gap-2"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-500/15 text-gold-700">
                        <FiPhoneCall className="h-3.5 w-3.5" />
                      </div>
                      <span>+91 98489 18992</span>
                    </a>
                    <span className="hidden sm:inline text-gold-500/50">•</span>
                    <a
                      href="tel:+919880833944"
                      className="font-roboto text-base font-bold text-brown-950 hover:text-gold-700 transition-colors flex items-center gap-2"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-500/15 text-gold-700">
                        <FiPhoneCall className="h-3.5 w-3.5" />
                      </div>
                      <span>+91 98808 33944</span>
                    </a>
                  </div>
                </div>

                <a
                  href="https://wa.me/919848918992"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-forest-800 px-4 py-3.5 text-sm font-bold text-cream-50 shadow-md transition hover:bg-forest-900 hover:shadow-lg font-roboto"
                >
                  <FaWhatsapp className="h-5 w-5 text-green-400" />
                  <span className="font-roboto">Instant Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Email Contact Card */}
            <div className="rounded-2xl border border-gold-500/50 bg-cream-50/95 p-6 sm:p-8 shadow-sm font-roboto">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/20 text-gold-700">
                  <FiMail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-brown-950">Email Support</h3>
                  <p className="font-roboto text-xs text-brown-600">Send inquiries directly to our inbox</p>
                </div>
              </div>

              <div className="mt-4 font-roboto">
                <a
                  href="mailto:info@mehfuzdryfruits.in"
                  className="flex items-center gap-3 rounded-xl border border-gold-500/30 bg-white p-3.5 text-brown-900 hover:bg-gold-500/10 hover:border-gold-500 transition font-roboto"
                >
                  <FiMail className="h-5 w-5 text-gold-600 shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-brown-500 uppercase tracking-wider font-roboto">Inquiries</p>
                    <p className="font-roboto text-base font-bold text-brown-950">info@mehfuzdryfruits.in</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry & Order Form */}
          <div className="lg:col-span-7 font-roboto">
            <div className="rounded-2xl border border-gold-500/50 bg-cream-50/95 p-6 shadow-lg font-roboto">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brown-950">Send an Enquiry</h2>
              <p className="mt-2 text-sm text-brown-700 font-roboto leading-relaxed">
                Fill in the details below for custom gift hampers, bulk wholesale orders, or general questions. Our harvest team will get back to you promptly.
              </p>

              {submitted ? (
                <div className="mt-8 rounded-2xl border border-gold-500/50 bg-gold-500/10 p-8 text-center animate-fade-in font-roboto">
                  <FiCheckCircle className="mx-auto h-12 w-12 text-forest-700" />
                  <h3 className="font-serif mt-4 text-2xl font-bold text-brown-950">Enquiry Received!</h3>
                  <p className="mt-2 text-sm text-brown-800 leading-relaxed font-roboto">
                    Thank you, <strong className="font-roboto">{formData.name}</strong>. Your message regarding{" "}
                    <span className="font-semibold text-gold-700 font-roboto">{formData.inquiryType}</span> has been logged. Our team will contact you at <strong className="font-roboto">{formData.phone}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        inquiryType: "Retail Order",
                        message: "",
                      });
                    }}
                    className="mt-6 inline-flex rounded-full bg-brown-950 px-6 py-2.5 text-xs font-bold text-gold-300 transition hover:bg-brown-900 font-roboto shadow-md"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5 font-roboto">
                  <div className="grid gap-5 sm:grid-cols-2 font-roboto">
                    <label className="block text-sm font-roboto">
                      <span className="mb-1.5 block font-semibold text-brown-900 font-roboto">Your Full Name *</span>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input font-roboto"
                      />
                    </label>

                    <label className="block text-sm font-roboto">
                      <span className="mb-1.5 block font-semibold text-brown-900 font-roboto">Phone Number *</span>
                      <input
                        required
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input font-roboto"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 font-roboto">
                    <label className="block text-sm font-roboto">
                      <span className="mb-1.5 block font-semibold text-brown-900 font-roboto">Email Address</span>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input font-roboto"
                      />
                    </label>

                    <label className="block text-sm font-roboto">
                      <span className="mb-1.5 block font-semibold text-brown-900 font-roboto">Inquiry Type *</span>
                      <select
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        className="input font-roboto cursor-pointer bg-white"
                      >
                        <option value="Retail Order">Retail Order</option>
                        <option value="Wholesale & Bulk">Wholesale &amp; Bulk Order</option>
                        <option value="Corporate Gift Hampers">Corporate Gift Hampers</option>
                        <option value="General Question">General Question</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-sm font-roboto">
                    <span className="mb-1.5 block font-semibold text-brown-900 font-roboto">Your Message / Requirements *</span>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please specify product types, required quantities (e.g. 5kg Afghan Anjeer, 50g Kashmiri Saffron), or custom hamper details..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="input font-roboto"
                    />
                  </label>

                  <button
                    type="submit"
                    className="metallic-gold-btn flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold shadow-lg transition hover:scale-[1.01] font-roboto cursor-pointer"
                  >
                    <FiSend className="h-4 w-4" />
                    <span className="font-roboto">Send Inquiry Now</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Feature Guarantees Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3 font-roboto">
          <div className="rounded-xl border border-gold-500/30 bg-cream-50/90 p-5 text-center shadow-sm font-roboto">
            <FiShield className="mx-auto h-7 w-7 text-gold-600 mb-2" />
            <h4 className="font-serif text-base font-bold text-brown-950">100% Direct Origin</h4>
            <p className="mt-1 text-xs text-brown-700 font-roboto leading-relaxed">
              Sourced at the harvest location without intermediaries or artificial preservatives.
            </p>
          </div>

          <div className="rounded-xl border border-gold-500/30 bg-cream-50/90 p-5 text-center shadow-sm font-roboto">
            <FiTruck className="mx-auto h-7 w-7 text-gold-600 mb-2" />
            <h4 className="font-serif text-base font-bold text-brown-950">Pan-India Express Shipping</h4>
            <p className="mt-1 text-xs text-brown-700 font-roboto leading-relaxed">
              Airtight tamper-proof luxury packaging delivered directly to your doorstep.
            </p>
          </div>

          <div className="rounded-xl border border-gold-500/30 bg-cream-50/90 p-5 text-center shadow-sm font-roboto">
            <FiAward className="mx-auto h-7 w-7 text-gold-600 mb-2" />
            <h4 className="font-serif text-base font-bold text-brown-950">Artisan Quality Grading</h4>
            <p className="mt-1 text-xs text-brown-700 font-roboto leading-relaxed">
              Every dry fruit and spice batch undergoes strict size, moisture, and aroma checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
