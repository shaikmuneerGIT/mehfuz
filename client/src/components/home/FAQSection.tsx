import { useState } from "react";
import { SectionTitle } from "../art/Ornaments";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const FAQS = [
  {
    question: "How fast is express delivery for dry fruits?",
    answer: "Orders are packed fresh within 24 hours of receiving. Express courier delivery takes 2-4 business days across major metro cities in India.",
  },
  {
    question: "Are your dry fruits and saffron 100% natural with zero chemicals?",
    answer: "Yes, 100%. Our Afghan figs are branch sun-dried naturally, our Kashmiri saffron is grade-A Laila saffron tested for high crocin, and our nuts contain zero artificial preservatives or sugar syrup.",
  },
  {
    question: "Do you offer wholesale bulk pricing for businesses?",
    answer: "Yes, we supply retail outlets, sweet manufacturers, hotels, and corporate gift buyers across India. Contact our sales line at +91 98489 18992 or send an inquiry.",
  },
  {
    question: "Can I order customized festival gift hampers?",
    answer: "We offer handcrafted wooden and rigid gift hampers customized with high-grade dry fruits, dates, saffron, and personalized greeting cards for corporate and festive occasions.",
  },
];

function FAQAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gold-500/30 bg-cream-50/90 transition-all hover:border-gold-500/60 font-roboto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-roboto cursor-pointer"
      >
        <span className="font-semibold text-brown-950 text-sm sm:text-base font-roboto">
          {question}
        </span>
        {isOpen ? (
          <FiChevronUp className="h-5 w-5 text-gold-600 shrink-0" />
        ) : (
          <FiChevronDown className="h-5 w-5 text-gold-600 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gold-500/20 px-4 py-4 sm:px-5 text-xs sm:text-sm text-brown-700 leading-relaxed font-roboto">
          <p className="font-roboto">{answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  return (
    <section className="border-t border-gold-500/40 bg-cream-100/60 py-16 font-roboto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 font-roboto">
        <SectionTitle eyebrow="Help &amp; Queries">Frequently Asked Questions</SectionTitle>
        <div className="mt-10 space-y-3 font-roboto">
          {FAQS.map((faq, idx) => (
            <FAQAccordionItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
