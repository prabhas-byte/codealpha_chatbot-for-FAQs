// FAQ Database
const faqs = [
  { q: "how can i track my order", a: "Go to 'My Orders' in your account → click the order → select 'Track Order' for real-time status." },
  { q: "what are the delivery charges", a: "Free delivery on orders above ₹499. Below that, flat ₹40 charge." },
  { q: "how many days does delivery take", a: "3–7 days for standard. Express (if available) 1–2 days." },
  { q: "can i return or exchange", a: "Yes, within 7 days if unused and in original condition." },
  { q: "how do i cancel my order", a: "Before shipping: My Orders → select order → Cancel." },
  { q: "payment methods", a: "UPI, Cards, Net Banking, Wallets, Cash on Delivery." },
  { q: "is cash on delivery available", a: "Yes, in most areas — select at checkout." },
  { q: "how to contact support", a: "Live Chat (10 AM–10 PM), email support@shopnow.com, or +91 98765 43210." },
  { q: "received damaged product", a: "Raise return within 48 hours with photos — replacement or refund arranged." },
  { q: "do you deliver outside india", a: "Currently only within India. International coming soon." }
];

// Simple English stopwords
const stopwords = ["i", "me", "my", "myself", "we", "our", "ours", "you", "your", "yours", "the", "a", "an", "and", "or", "but", "if", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once"];

// Preprocess text (same as Python version)
function preprocess(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')           // remove punctuation
    .split(/\s+/)
    .filter(word => word && !stopwords.includes(word))
    .join(' ');
}

// Preprocess all FAQ questions
const processedFAQs = faqs.map(f => preprocess(f.q));

// Very simple TF-IDF like term frequency + document frequency
function computeTFIDF(docs) {
  const vocab = {};
  docs.forEach(doc => {
    const words = doc.split(' ');
    words.forEach(w => { vocab[w] = (vocab[w] || 0) + 1; });
  });

  const tfidf = docs.map(doc => {
    const vec = {};
    const words = doc.split(' ');
    words.forEach(w => {
      vec[w] = (vec[w] || 0) + 1; // term frequency
    });
    Object.keys(vec).forEach(w => {
      vec[w] *= Math.log(docs.length / (1 + (vocab[w] || 0))); // * IDF
    });
    return vec;
  });

  return { vocab, vectors: tfidf };
}

const { vocab, vectors } = computeTFIDF(processedFAQs);

// Cosine similarity between two vectors
function cosineSim(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  Object.keys(vocab).forEach(term => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  });
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

// Find best match
function getBestAnswer(question) {
  const cleaned = preprocess(question);
  if (!cleaned) return "Sorry, I didn't understand. Try asking about orders, delivery, returns, etc.";

  const qVec = {};
  cleaned.split(' ').forEach(w => {
    if (vocab[w]) qVec[w] = (qVec[w] || 0) + 1;
  });

  let bestScore = 0;
  let bestAnswer = "";

  vectors.forEach((vec, i) => {
    const score = cosineSim(qVec, vec);
    if (score > bestScore && score > 0.15) {  // threshold ~0.15–0.25
      bestScore = score;
      bestAnswer = faqs[i].a;
    }
  });

  return bestAnswer || "Sorry, I couldn't find a matching answer. Try rephrasing or ask support!";
}

// Chat logic
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

function addMessage(text, isBot = false) {
  const div = document.createElement('div');
  div.className = `message ${isBot ? 'bot' : 'user'}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = text.replace(/\n/g, '<br>');
  div.appendChild(bubble);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, false);
  userInput.value = '';

  setTimeout(() => {
    const answer = getBestAnswer(text);
    addMessage(answer, true);
  }, 600); // slight delay for realism
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});