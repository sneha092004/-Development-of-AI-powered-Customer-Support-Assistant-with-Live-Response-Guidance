import { useState } from "react";

const faqs = [
  {
    question: "How do I track my order?",
    answer:
      "Go to the Orders page and enter your order number to see its current status.",
  },
  {
    question: "How do I return a product?",
    answer:
      "Open AI Chat and type 'Return product' — our assistant will guide you through the return process step by step.",
  },
  {
    question: "My payment was deducted but the order isn't confirmed. What do I do?",
    answer:
      "This is usually temporary. Open AI Chat and describe the issue — the assistant will check the status and explain next steps.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery usually takes 5-9 business days depending on your location and the item ordered.",
  },
  {
    question: "Can I cancel my order?",
    answer:
      "Orders can be cancelled before they are shipped. Ask AI Chat to cancel your order and it will check if it's still possible.",
  },
];

function SupportPage({ onGoToChat }) {
  const [openIndex, setOpenIndex] = useState(null);

  function toggleFaq(index) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section className="support-page">
      <div className="support-container">
        <h1>🛟 Support Center</h1>
        <p className="support-subtitle">
          Find quick answers below, or chat with our AI Assistant for
          anything else.
        </p>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className="faq-item" key={index}>
              <button
                className="faq-question"
                onClick={() => toggleFaq(index)}
              >
                {faq.question}
                <span>{openIndex === index ? "−" : "+"}</span>
              </button>

              {openIndex === index && (
                <div className="faq-answer">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>

        <div className="support-cta">
          <p>Didn't find what you're looking for?</p>
          <button className="support-chat-button" onClick={onGoToChat}>
            💬 Chat with AI Assistant
          </button>
        </div>
      </div>
    </section>
  );
}

export default SupportPage;

