import type { ReactNode } from "react";
import { PageBanner } from "../components/PageBanner";

const CONTACT = (
  <>
    <a href="tel:+919848918992" className="font-semibold text-gold-700 hover:underline">
      +91 98489 18992
    </a>{" "}
    or{" "}
    <a
      href="mailto:orders@mehfuzdryfruits.in"
      className="font-semibold text-gold-700 hover:underline"
    >
      orders@mehfuzdryfruits.in
    </a>
  </>
);

function PolicyLayout({
  title,
  subtitle,
  image,
  children,
}: {
  title: string;
  subtitle: string;
  image: string;
  children: ReactNode;
}) {
  return (
    <div className="parchment min-h-screen font-roboto">
      <PageBanner title={title} subtitle={subtitle} image={image} breadcrumbs={[{ label: title }]} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 font-roboto">
        <div className="rounded-2xl border border-gold-500/30 bg-cream-50/90 p-6 shadow-sm sm:p-9">
          <div className="space-y-5 text-sm leading-relaxed text-brown-800 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-brown-950 [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_li]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
          <p className="mt-8 border-t border-gold-500/25 pt-4 text-xs text-brown-500">
            Questions about this policy? Contact us at {CONTACT}. Mehfuz Premium Dry Fruits &amp;
            Commodities, Hyderabad, Telangana. FSSAI Registration No. 23626443000038.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <PolicyLayout
      title="Terms and Conditions"
      subtitle="The terms that apply when you order from Mehfuz."
      image="/images/hero_banner_2.webp?v=3"
    >
      <p>
        By placing an order on mehfuzdryfruits.in you agree to these terms. Please read them
        along with our Privacy Policy, Shipping &amp; Tracking Policy and Return, Exchange &amp;
        Refund Policy.
      </p>

      <h2>Who we are</h2>
      <p>
        Mehfuz Premium Dry Fruits &amp; Commodities sells dry fruits, nuts, dates, saffron,
        coffee and spices sourced directly from growing regions including Afghanistan, Kashmir,
        Coorg, Chikmagalur and Guntur. We operate from Hyderabad, Telangana, India, and are
        registered with the FSSAI under number 23626443000038.
      </p>

      <h2>Orders</h2>
      <ul>
        <li>
          Placing an order is an offer to buy. Your order is confirmed only once we accept it
          and your payment is verified.
        </li>
        <li>
          We may decline or cancel an order if an item is out of stock, if a price or product
          description was published in error, if the delivery address is outside our service
          area, or if we suspect fraudulent activity. Any amount already paid is refunded in
          full.
        </li>
        <li>
          Product photographs are indicative. Natural produce varies in size, shade and
          appearance between harvests.
        </li>
      </ul>

      <h2>Prices and payment</h2>
      <ul>
        <li>All prices are in Indian Rupees (₹) and include applicable taxes.</li>
        <li>
          We currently accept prepaid payment by UPI. After placing your order you will see a
          UPI QR code and our UPI ID; you may pay using any UPI app.
        </li>
        <li>
          After paying, please submit the last digits of your UPI transaction reference on the
          order page so we can match the payment. Orders are packed only after we confirm the
          payment has been received.
        </li>
        <li>We do not collect or store your card, UPI PIN or banking credentials.</li>
      </ul>

      <h2>Weights and quality</h2>
      <p>
        Pack sizes refer to net weight at the time of packing. Slight variation can occur
        because natural produce loses or gains moisture. Store products in a cool, dry,
        airtight container away from direct sunlight.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide an accurate name, phone number and delivery address.</li>
        <li>Be reachable on the phone number given, so we can coordinate delivery.</li>
        <li>Do not resell our products as your own brand without written permission.</li>
      </ul>

      <h2>Liability</h2>
      <p>
        Our responsibility for any order is limited to the amount you paid for that order. We
        are not liable for delays caused by events outside our control, such as transport
        disruption, weather or courier strikes. Nothing in these terms limits any right you
        have under Indian consumer law.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, and the courts at Hyderabad, Telangana
        have jurisdiction over any dispute.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. The version published on this page at the
        time you place an order is the one that applies to it.
      </p>
    </PolicyLayout>
  );
}

export function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      subtitle="What we collect, why we collect it, and how it is protected."
      image="/images/hero_banner_3.webp?v=3"
    >
      <p>
        We ask for only what we need to deliver your order and to help you when you contact us.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <b>Order details</b> — your name, phone number, delivery address, and email address if
          you choose to give one.
        </li>
        <li>
          <b>Payment reference</b> — the transaction digits you submit so we can match your UPI
          payment. We never see or store your UPI PIN, card details or bank login.
        </li>
        <li>
          <b>Messages</b> — what you send us by WhatsApp, email, phone or the website chat.
        </li>
        <li>
          <b>Basic site data</b> — your cart is stored in your own browser. Our hosting provider
          keeps standard server logs for security.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To confirm, pack, deliver and support your order.</li>
        <li>To send order confirmation and payment updates by email or WhatsApp.</li>
        <li>To keep records required for tax and food-safety compliance.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        Only those who need it to complete your order — chiefly the courier or delivery partner
        carrying your parcel, and our email and hosting providers. We do not sell, rent or trade
        your personal information to anyone for marketing.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Order records are retained for as long as required by Indian tax and accounting rules.
        You may ask us to delete information we are not legally required to keep.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Ask what information we hold about you, and have mistakes corrected.</li>
        <li>Ask us to stop sending promotional messages at any time.</li>
        <li>Request deletion of information we are not obliged to retain.</li>
      </ul>
      <p>To make any of these requests, contact us at {CONTACT}.</p>

      <h2>Security</h2>
      <p>
        The site runs over an encrypted HTTPS connection and admin access is password
        protected. No system is perfectly secure, but we take reasonable care to protect the
        information you give us.
      </p>
    </PolicyLayout>
  );
}

export function ShippingPage() {
  return (
    <PolicyLayout
      title="Shipping & Tracking"
      subtitle="How your order reaches you, and how to follow its progress."
      image="/images/hero_banner_4.webp?v=3"
    >
      <h2>Delivery charges</h2>
      <p>
        Orders are shipped through <b>DTDC</b> and the delivery fee depends on the weight of
        your parcel — ₹60 up to 500 g, ₹100 up to 1 kg, ₹80 per kg for 2–3 kg, and ₹60 per kg
        above that. The exact amount is shown at checkout before you pay, and orders above the
        free-delivery threshold shown there ship free.
      </p>

      <h2>Dispatch time</h2>
      <ul>
        <li>Orders are packed after your UPI payment is confirmed.</li>
        <li>
          We usually dispatch within 1–3 working days. Fresh-stock items or large quantities can
          take a little longer, and we will tell you if so.
        </li>
        <li>Orders placed on Sundays and public holidays are processed the next working day.</li>
      </ul>

      <h2>Delivery time</h2>
      <p>
        Deliveries within Hyderabad usually arrive in 1–3 working days after dispatch,
        depending on your location.
      </p>

      <h2>Tracking your order</h2>
      <ul>
        <li>
          Every order has an order number in the format <b>MFZ26081234</b>, shown on screen and
          in your confirmation email.
        </li>
        <li>
          Enter that number in the chat window on our site, under “Where is my order?”, to see
          its current status at any time.
        </li>
        <li>
          Once your parcel is handed to the courier, we share the tracking details on WhatsApp
          or by phone.
        </li>
      </ul>

      <h2>Packaging</h2>
      <p>
        Products are packed in food-grade, moisture-resistant pouches and sealed cartons.
        Gift packing is available on request for hampers and festival orders — ask us on
        WhatsApp before placing your order.
      </p>

      <h2>If delivery fails</h2>
      <p>
        Couriers usually attempt delivery more than once. If they cannot reach you on the
        number provided, the parcel may be returned to us; we will contact you to arrange a
        re-delivery. Please make sure someone is available at the address during the day.
      </p>

      <h2>Serviceable areas</h2>
      <p>
        We currently deliver <b>within Hyderabad only</b>. If your pincode is outside our
        delivery area, checkout will let you know — message us on WhatsApp and we'll try to
        arrange something for you. For bulk, corporate or wholesale orders, contact us at{" "}
        {CONTACT}.
      </p>
    </PolicyLayout>
  );
}

export function ReturnsPage() {
  return (
    <PolicyLayout
      title="Return, Exchange & Refund Policy"
      subtitle="What to do if something is not right with your order."
      image="/images/realistic_dry_fruits_banner_1.webp?v=3"
    >
      <p>
        Every order is checked and weighed before it leaves us. If something is still wrong when
        it reaches you, we will put it right.
      </p>

      <h2>When we replace or refund</h2>
      <ul>
        <li>The product arrived damaged, leaking, or with a broken seal.</li>
        <li>You received the wrong product or the wrong pack size.</li>
        <li>An item is missing from your parcel.</li>
        <li>The product is spoiled, infested or clearly not of acceptable quality on arrival.</li>
      </ul>

      <h2>Food safety — what we cannot take back</h2>
      <p>
        Because these are food products, we cannot accept returns of items that have been
        opened, tasted, or stored after delivery, unless they fall under the situations listed
        above. This protects the safety of every customer we serve.
      </p>

      <h2>How to raise a request</h2>
      <ul>
        <li>
          Tell us within <b>48 hours</b> of delivery on WhatsApp or by calling{" "}
          <a href="tel:+919848918992" className="font-semibold text-gold-700 hover:underline">
            +91 98489 18992
          </a>
          , quoting your order number.
        </li>
        <li>
          Send clear photographs of the product, the packaging and the seal. An unboxing video
          helps us settle claims fastest, especially for damage or missing items.
        </li>
        <li>Keep the product and its packaging until your request is resolved.</li>
      </ul>

      <h2>Exchange</h2>
      <p>
        Where stock allows, we will send a replacement of the same product at no extra cost. If
        the item is unavailable, you may choose another product of the same value or a refund.
      </p>

      <h2>Refunds</h2>
      <ul>
        <li>
          Approved refunds are returned to the same UPI account you paid from, usually within
          5–7 working days of approval.
        </li>
        <li>
          If your order is cancelled by us — for example if an item turns out to be out of
          stock — the full amount is refunded, including any delivery charge paid.
        </li>
      </ul>

      <h2>Cancelling an order</h2>
      <p>
        You can cancel free of charge any time before your order is dispatched — just message us
        with your order number. Once a parcel has been handed to the courier it can no longer be
        cancelled, but the situations above still apply if there is a problem on arrival.
      </p>
    </PolicyLayout>
  );
}
