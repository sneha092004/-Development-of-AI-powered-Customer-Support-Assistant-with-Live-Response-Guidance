


import {
  useEffect,
  useRef,
  useState,
} from "react";
import "../App.css";

const HISTORY_KEY = "aiCustomerSupportChatHistory";

function AnalysisBar({ label, value }) {
  const numericValue =
    typeof value === "number"
      ? Math.max(0, Math.min(100, value))
      : 0;

  return (
    <div className="analysis-bar-container">
      <div className="analysis-bar-header">
        <span>{label}</span>
        <strong>{numericValue}%</strong>
      </div>

      <div className="analysis-bar">
        <div
          className="analysis-bar-fill"
          style={{ width: `${numericValue}%` }}
        />
      </div>
    </div>
  );
}

const defaultAnalysis = {
  sentiment: "Waiting...",
  sentiment_percentage: 0,
  intent: "Waiting...",
  intent_percentage: 0,
  urgency: "Waiting...",
  urgency_percentage: 0,
  escalation: "Waiting...",
  escalation_percentage: 0,
  key_issue: "Waiting...",
  coaching: "Waiting for customer message...",
  suggestion: "Waiting for AI suggestion...",
};

function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showAgent, setShowAgent] = useState(false);
  const [escalationTriggered, setEscalationTriggered] =
    useState(false);
  const [showSuggestion, setShowSuggestion] =
    useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] =
    useState(defaultAnalysis);

  const [chatHistory, setChatHistory] = useState([]);

  const currentChatIdRef = useRef(
    `chat-${Date.now()}`
  );

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] =
    useState(false);

  useEffect(() => {
    try {
      const savedHistory =
        localStorage.getItem(HISTORY_KEY);

      if (savedHistory) {
        const parsedHistory =
          JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory)) {
          setChatHistory(parsedHistory);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load chat history:",
        error
      );
    }
  }, []);

  function saveCurrentChat(
    currentMessages = messages,
    currentAnalysis = analysis
  ) {
    const meaningfulMessages =
      currentMessages.filter(
        (item) =>
          item &&
          typeof item.text === "string" &&
          item.text.trim()
      );

    if (meaningfulMessages.length === 0) {
      return;
    }

    try {
      const savedHistory =
        localStorage.getItem(HISTORY_KEY);

      let history = [];

      if (savedHistory) {
        const parsed =
          JSON.parse(savedHistory);

        if (Array.isArray(parsed)) {
          history = parsed;
        }
      }

      const firstUserMessage =
        meaningfulMessages.find(
          (item) => item.type === "user"
        );

      const title =
        firstUserMessage?.text
          ?.replace(/^💡 Suggestion:\s*/i, "")
          .trim()
          .slice(0, 35) ||
        "Customer Support Chat";

      const chatObject = {
        id: currentChatIdRef.current,
        title:
          title.length >= 35
            ? `${title}...`
            : title,
        messages: meaningfulMessages,
        analysis: currentAnalysis,
        updatedAt: new Date().toISOString(),
      };

      const existingIndex =
        history.findIndex(
          (chat) =>
            chat.id ===
            currentChatIdRef.current
        );

      if (existingIndex !== -1) {
        history[existingIndex] =
          chatObject;
      } else {
        history = [
          chatObject,
          ...history,
        ];
      }

      history = history.slice(0, 20);

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
      );

      setChatHistory(history);
    } catch (error) {
      console.error(
        "Failed to save chat history:",
        error
      );
    }
  }

  function loadChat(chat) {
    if (!chat) {
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log(
          "Voice recognition already stopped."
        );
      }
    }

    setIsListening(false);

    setMessages(
      Array.isArray(chat.messages)
        ? chat.messages
        : []
    );

    setAnalysis(
      chat.analysis || defaultAnalysis
    );

    setMessage("");
    setSuggestion("");
    setShowSuggestion(false);
    setLoading(false);

    currentChatIdRef.current =
      chat.id || `chat-${Date.now()}`;

    const hasAgent =
      Array.isArray(chat.messages) &&
      chat.messages.some(
        (item) => item.type === "agent"
      );

    setShowAgent(hasAgent);

    const savedAnalysis =
      chat.analysis || {};

    const escalationText =
      String(
        savedAnalysis.escalation || ""
      ).toLowerCase();

    const escalationScore =
      Number(
        savedAnalysis.escalation_percentage ||
          0
      );

    setEscalationTriggered(
      escalationText.includes("high") ||
        escalationScore >= 70
    );
  }

  function deleteChat(chatId, event) {
    event.stopPropagation();

    try {
      const savedHistory =
        localStorage.getItem(HISTORY_KEY);

      if (!savedHistory) {
        return;
      }

      const history =
        JSON.parse(savedHistory);

      if (!Array.isArray(history)) {
        return;
      }

      const updatedHistory =
        history.filter(
          (chat) => chat.id !== chatId
        );

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );

      setChatHistory(updatedHistory);
    } catch (error) {
      console.error(
        "Failed to delete chat:",
        error
      );
    }
  }

  useEffect(() => {
    const escalationRaw =
      localStorage.getItem(
        "supportEscalation"
      );

    const orderMessage =
      localStorage.getItem(
        "orderSupportMessage"
      );

    const orderDataRaw =
      localStorage.getItem(
        "orderSupportData"
      );

    if (!escalationRaw && !orderMessage) {
      return;
    }

    let escalationData = null;
    let orderData = null;

    try {
      if (escalationRaw) {
        escalationData =
          JSON.parse(escalationRaw);
      }
    } catch (error) {
      console.error(
        "Invalid escalation data:",
        error
      );
    }

    try {
      if (orderDataRaw) {
        orderData =
          JSON.parse(orderDataRaw);
      }
    } catch (error) {
      console.error(
        "Invalid order data:",
        error
      );
    }

    const orderId =
      escalationData?.orderId ||
      orderData?.orderId ||
      "";

    const status =
      escalationData?.status ||
      orderData?.status ||
      "";

    const location =
      escalationData?.location ||
      orderData?.location ||
      "";

    const expected =
      escalationData?.expectedDelivery ||
      orderData?.expected ||
      "";

    const items =
      escalationData?.items ||
      orderData?.items ||
      "";

    const isAgentRequest =
      Boolean(escalationData);

    const customerMessage =
      escalationData?.message ||
      orderMessage ||
      "";

    if (isAgentRequest) {
      const initialMessages = [
        {
          type: "user",
          text: `👨‍💼 Support request for order ${orderId}`,
        },
        {
          type: "bot",
          text:
            `I understand that you need support with order ${orderId}. ` +
            `The order is currently ${status} at ${location}. ` +
            `The expected delivery date is ${expected}.`,
        },
        {
          type: "bot",
          text:
            `📦 Order: ${orderId}\n` +
            `🚚 Status: ${status}\n` +
            `📍 Location: ${location}\n` +
            `📅 Expected Delivery: ${expected}\n` +
            `🛍️ Items: ${items}`,
        },
        {
          type: "agent",
          text:
            "Hello! I'm a support agent. I'll take over this conversation and help you with your delayed order.",
        },
      ];

      const initialAnalysis = {
        sentiment: "Negative",
        sentiment_percentage: 85,
        intent: "Order Delay",
        intent_percentage: 95,
        urgency: "High",
        urgency_percentage: 85,
        escalation: "High",
        escalation_percentage: 90,
        key_issue: "Delayed Order",
        coaching:
          "Customer requires immediate assistance regarding the delayed order. Verify the shipment status and explain the next available resolution.",
        suggestion:
          "🚨 Next Best Action: Review the delayed order and provide the customer with an updated delivery resolution.",
      };

      setMessages(initialMessages);
      setShowAgent(true);
      setEscalationTriggered(false);
      setAnalysis(initialAnalysis);

      setTimeout(() => {
        saveCurrentChat(
          initialMessages,
          initialAnalysis
        );
      }, 0);
    } else {
      setMessages([
        {
          type: "user",
          text: customerMessage,
        },
        {
          type: "bot",
          text:
            "I can help you with your order. Let me check the available order information and assist you.",
        },
      ]);
    }

    localStorage.removeItem(
      "supportEscalation"
    );
    localStorage.removeItem(
      "orderSupportMessage"
    );
    localStorage.removeItem(
      "orderSupportData"
    );
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn(
        "Speech Recognition is not supported in this browser."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript ||
        "";

      if (transcript.trim()) {
        setMessage((previousMessage) => {
          if (previousMessage.trim()) {
            return `${previousMessage} ${transcript}`;
          }

          return transcript;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "Voice recognition error:",
        event.error
      );

      setIsListening(false);

      if (
        event.error ===
        "not-allowed"
      ) {
        alert(
          "Microphone permission was denied. Please allow microphone access in your browser."
        );
      } else if (
        event.error ===
        "no-speech"
      ) {
        console.log(
          "No speech detected."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.log(
          "Recognition cleanup complete."
        );
      }

      recognitionRef.current = null;
    };
  }, []);

  function handleVoiceInput() {
    const recognition =
      recognitionRef.current;

    if (!recognition) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );

      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error(
          "Could not stop voice recognition:",
          error
        );
      }

      setIsListening(false);
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Could not start voice recognition:",
        error
      );
    }
  }

  function suggestedQuestion(text) {
    setMessage(text);
  }

  function resetAnalysis() {
    setAnalysis({
      ...defaultAnalysis,
    });
  }

  function setAnalyzing() {
    setAnalysis({
      sentiment: "Analyzing...",
      sentiment_percentage: 0,
      intent: "Analyzing...",
      intent_percentage: 0,
      urgency: "Analyzing...",
      urgency_percentage: 0,
      escalation: "Analyzing...",
      escalation_percentage: 0,
      key_issue: "Analyzing...",
      coaching:
        "AI is analyzing the conversation...",
      suggestion:
        "AI is generating agent suggestion...",
    });
  }

  function safeNumber(value) {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, number)
    );
  }

  function updateAnalysis(data) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      return;
    }

    const escalationValue =
      data.escalation_risk ||
      data.escalation ||
      data.escalation_level ||
      "Not available";

    const escalationPercentage =
      safeNumber(
        data.escalation_percentage ??
          data.escalation_score ??
          data.escalation_confidence ??
          0
      );

    const escalationText =
      String(
        escalationValue
      ).toUpperCase();

    const isHighEscalation =
      escalationText.includes(
        "HIGH"
      ) ||
      escalationPercentage >= 70;

    if (isHighEscalation) {
      setEscalationTriggered(
        true
      );
    }

    setAnalysis({
      sentiment:
        data.sentiment ||
        data.sentiment_label ||
        "Not available",

      sentiment_percentage:
        safeNumber(
          data.sentiment_percentage ??
            data.sentiment_score ??
            data.sentiment_confidence ??
            0
        ),

      intent:
        data.intent ||
        data.intent_label ||
        "Not available",

      intent_percentage:
        safeNumber(
          data.intent_percentage ??
            data.intent_score ??
            data.intent_confidence ??
            0
        ),

      urgency:
        data.urgency ||
        data.urgency_level ||
        "Not available",

      urgency_percentage:
        safeNumber(
          data.urgency_percentage ??
            data.urgency_score ??
            data.urgency_confidence ??
            0
        ),

      escalation:
        escalationValue,

      escalation_percentage:
        escalationPercentage,

      key_issue:
        data.key_issue ||
        data.issue ||
        "Not available",

      coaching:
        isHighEscalation
          ? "High escalation risk detected. Connect the customer to a human support agent."
          : data.coaching ||
            data.coaching_tip ||
            data.recommendation ||
            "No coaching suggestion available.",

      suggestion:
        isHighEscalation
          ? "🚨 Next Best Action: Connect the customer to a human support agent immediately."
          : data.suggestion ||
            data.suggested_reply ||
            data.agent_suggestion ||
            "No agent suggestion available.",
    });
  }

  async function readJsonResponse(
    response
  ) {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    const rawText =
      await response.text();

    if (!rawText) {
      throw new Error(
        `Empty response from backend (${response.status})`
      );
    }

    if (
      !contentType.includes(
        "application/json"
      )
    ) {
      console.error(
        "Backend returned:",
        rawText
      );

      throw new Error(
        `Backend returned non-JSON response (${response.status}).`
      );
    }

    try {
      return JSON.parse(rawText);
    } catch (error) {
      console.error(
        "Invalid JSON:",
        rawText
      );

      throw new Error(
        "Backend returned invalid JSON."
      );
    }
  }

  async function sendMessage() {
    if (
      !message.trim() ||
      loading
    ) {
      return;
    }

    const userMessage =
      message.trim();

    const userMessageObject = {
      type: "user",
      text: userMessage,
    };

    setMessages(
      (previousMessages) => [
        ...previousMessages,
        userMessageObject,
      ]
    );

    setMessage("");
    setLoading(true);
    setAnalyzing();

    try {
      const response =
        await fetch(
          "http://127.0.0.1:5000/chat",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message: userMessage,
            }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            `Backend error (${response.status})`
        );
      }

      updateAnalysis(data);

      const botMessage = {
        type: "bot",
        text:
          data.reply ||
          data.response ||
          data.message ||
          "No AI response received.",
      };

      setMessages(
        (previousMessages) => {
          const updatedMessages = [
            ...previousMessages,
            botMessage,
          ];

          saveCurrentChat(
            updatedMessages,
            data
          );

          return updatedMessages;
        }
      );

      if (
        data.order_id &&
        data.order
      ) {
        localStorage.setItem(
          "lastTrackedOrder",
          JSON.stringify({
            orderId:
              data.order_id,
            ...data.order,
          })
        );
      }
    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      let errorMessage =
        error.message;

      if (
        error instanceof TypeError &&
        error.message
          .toLowerCase()
          .includes("fetch")
      ) {
        errorMessage =
          "Cannot connect to Flask backend. Make sure app.py is running on http://127.0.0.1:5000";
      }

      const errorBotMessage = {
        type: "bot",
        text:
          `AI processing failed: ${errorMessage}`,
      };

      setMessages(
        (previousMessages) => {
          const updatedMessages = [
            ...previousMessages,
            errorBotMessage,
          ];

          saveCurrentChat(
            updatedMessages,
            analysis
          );

          return updatedMessages;
        }
      );

      setAnalysis({
        sentiment: "Unavailable",
        sentiment_percentage: 0,
        intent: "Unavailable",
        intent_percentage: 0,
        urgency: "Unavailable",
        urgency_percentage: 0,
        escalation: "Unavailable",
        escalation_percentage: 0,
        key_issue:
          "Backend processing failed",
        coaching:
          `Backend error: ${errorMessage}`,
        suggestion:
          "Check the Flask terminal for the exact error.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (
      !file ||
      loading
    ) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    const fileName =
      file.name.toLowerCase();

    const validExtension =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".webp");

    if (
      !allowedTypes.includes(
        file.type
      ) &&
      !validExtension
    ) {
      setMessages(
        (previousMessages) => [
          ...previousMessages,
          {
            type: "bot",
            text:
              "Unsupported file. Please upload PDF, PNG, JPG, JPEG, or WEBP.",
          },
        ]
      );

      event.target.value = "";
      return;
    }

    const uploadMessage = {
      type: "user",
      text: `📎 Uploaded: ${file.name}`,
    };

    setMessages(
      (previousMessages) => [
        ...previousMessages,
        uploadMessage,
      ]
    );

    setLoading(true);
    setAnalyzing();

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    try {
      const response =
        await fetch(
          "http://127.0.0.1:5000/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            `File processing failed (${response.status})`
        );
      }

      updateAnalysis(data);

      const botMessage = {
        type: "bot",
        text:
          data.reply ||
          data.response ||
          data.message ||
          `I reviewed "${file.name}".`,
      };

      setMessages(
        (previousMessages) => {
          const updatedMessages = [
            ...previousMessages,
            botMessage,
          ];

          saveCurrentChat(
            updatedMessages,
            data
          );

          return updatedMessages;
        }
      );
    } catch (error) {
      console.error(
        "File upload error:",
        error
      );

      const errorMessage = {
        type: "bot",
        text:
          `File processing failed: ${error.message}`,
      };

      setMessages(
        (previousMessages) => {
          const updatedMessages = [
            ...previousMessages,
            errorMessage,
          ];

          saveCurrentChat(
            updatedMessages,
            analysis
          );

          return updatedMessages;
        }
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function connectAgent() {
    setShowAgent(true);
    setEscalationTriggered(
      false
    );

    const agentMessage = {
      type: "agent",
      text:
        "Hello! I'm a support agent. I'll take over this conversation and help you with your issue.",
    };

    setMessages(
      (previousMessages) => {
        const updatedMessages = [
          ...previousMessages,
          agentMessage,
        ];

        saveCurrentChat(
          updatedMessages,
          analysis
        );

        return updatedMessages;
      }
    );
  }

  function submitSuggestion() {
    if (!suggestion.trim()) {
      return;
    }

    const suggestionMessage = {
      type: "user",
      text:
        `💡 Suggestion: ${suggestion.trim()}`,
    };

    setMessages(
      (previousMessages) => {
        const updatedMessages = [
          ...previousMessages,
          suggestionMessage,
        ];

        saveCurrentChat(
          updatedMessages,
          analysis
        );

        return updatedMessages;
      }
    );

    setSuggestion("");
    setShowSuggestion(false);
  }

  function startNewChat() {
    if (messages.length > 0) {
      saveCurrentChat(
        messages,
        analysis
      );
    }

    currentChatIdRef.current =
      `chat-${Date.now()}`;

    setMessages([]);
    setMessage("");
    setShowAgent(false);
    setEscalationTriggered(
      false
    );
    setShowSuggestion(false);
    setSuggestion("");
    setLoading(false);
    resetAnalysis();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log(
          "Voice already stopped."
        );
      }
    }

    setIsListening(false);
  }

  return (
    <div className="chat-page-container">
      <div className="ai-chat-title">
        🤖 AI Chat
      </div>

      <div className="ai-chat-page">
        <aside className="chat-sidebar">
          <button
            className="new-chat-button"
            onClick={startNewChat}
          >
            ➕ New Chat
          </button>

          <div className="sidebar-section">
            <h3>🕘 Chat History</h3>

            {chatHistory.length === 0 ? (
              <div
                style={{
                  padding: "10px",
                  fontSize: "13px",
                  color: "#777",
                }}
              >
                No previous chats
              </div>
            ) : (
              chatHistory.map(
                (chat) => (
                  <button
                    className="history-item"
                    key={chat.id}
                    type="button"
                    onClick={() =>
                      loadChat(chat)
                    }
                    title={
                      chat.title
                    }
                  >
                    <span>
                      💬{" "}
                      {chat.title}
                    </span>

                    <span
                      onClick={(
                        event
                      ) =>
                        deleteChat(
                          chat.id,
                          event
                        )
                      }
                      style={{
                        marginLeft:
                          "auto",
                        cursor:
                          "pointer",
                        paddingLeft:
                          "8px",
                      }}
                      title="Delete chat"
                    >
                      🗑️
                    </span>
                  </button>
                )
              )
            )}
          </div>

          <div className="sidebar-section">
            <h3>
              Customer Tools
            </h3>

            <label className="sidebar-button">
              📎 Upload Image

              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                hidden
                onChange={
                  handleFileUpload
                }
                disabled={
                  loading
                }
              />
            </label>

            <label className="sidebar-button">
              📄 Invoice / PDF

              <input
                type="file"
                accept=".pdf,application/pdf"
                hidden
                onChange={
                  handleFileUpload
                }
                disabled={
                  loading
                }
              />
            </label>

            <button
              className={
                isListening
                  ? "sidebar-button voice-listening"
                  : "sidebar-button"
              }
              type="button"
              onClick={
                handleVoiceInput
              }
              disabled={loading}
            >
              {isListening
                ? "🔴 Listening..."
                : "🎤 Voice Input"}
            </button>

            <button
              className="sidebar-button"
              type="button"
              onClick={() =>
                setShowSuggestion(
                  !showSuggestion
                )
              }
            >
              💡 Suggestion
            </button>

            {showSuggestion && (
              <div className="suggestion-box">
                <textarea
                  value={
                    suggestion
                  }
                  onChange={(e) =>
                    setSuggestion(
                      e.target.value
                    )
                  }
                  placeholder="Write your suggestion..."
                />

                <button
                  type="button"
                  onClick={
                    submitSuggestion
                  }
                >
                  Submit
                </button>
              </div>
            )}
          </div>

          <div className="support-section">
            {!showAgent ? (
              <button
                className="support-button"
                type="button"
                onClick={
                  connectAgent
                }
              >
                {escalationTriggered
                  ? "🚨 Connect to Human Agent"
                  : "👨‍💼 Talk to Support Agent"}
              </button>
            ) : (
              <div className="agent-connected">
                👨‍💼 Support Agent
                Connected
              </div>
            )}
          </div>
        </aside>

        <main className="main-chat">
          <div className="chat-header">
            <div>
              <h2>
                🤖 AI Assistant
              </h2>

              <span className="online-status">
                ● Online
              </span>
            </div>
          </div>

          <div className="messages">
            {messages.length === 0 && (
              <div className="bot-message">
                <div className="message-avatar">
                  🤖
                </div>

                <div className="message-content">
                  <b>
                    AI Assistant
                  </b>

                  <p>
                    👋 Hello! Welcome to
                    AI Customer Support.
                  </p>

                  <p>
                    How can I help you
                    today?
                  </p>
                </div>
              </div>
            )}

            {messages.map(
              (msg, index) => (
                <div
                  key={index}
                  className={
                    msg.type ===
                    "user"
                      ? "user-message"
                      : msg.type ===
                        "agent"
                      ? "agent-message"
                      : "bot-message"
                  }
                >
                  <div className="message-avatar">
                    {msg.type ===
                    "user"
                      ? "👤"
                      : msg.type ===
                        "agent"
                      ? "👨‍💼"
                      : "🤖"}
                  </div>

                  <div className="message-content">
                    <b>
                      {msg.type ===
                      "user"
                        ? "You"
                        : msg.type ===
                          "agent"
                        ? "Support Agent"
                        : "AI Assistant"}
                    </b>

                    <p
                      style={{
                        whiteSpace:
                          "pre-line",
                      }}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="bot-message">
                <div className="message-avatar">
                  🤖
                </div>

                <div className="message-content">
                  <b>
                    AI Assistant
                  </b>

                  <p>
                    Analyzing your
                    message...
                  </p>

                  <div className="typing-loader">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="suggested-area">
            <p>
              💡 Suggested Questions
            </p>

            <div className="suggested-buttons">
              <button
                type="button"
                onClick={() =>
                  suggestedQuestion(
                    "Track my order ORD98765"
                  )
                }
              >
                Track my order
              </button>

              <button
                type="button"
                onClick={() =>
                  suggestedQuestion(
                    "Return product"
                  )
                }
              >
                Return product
              </button>

              <button
                type="button"
                onClick={() =>
                  suggestedQuestion(
                    "Payment issue"
                  )
                }
              >
                Payment issue
              </button>
            </div>
          </div>

          <div className="input-area">
            <input
              type="text"
              value={message}
              placeholder={
                isListening
                  ? "Listening..."
                  : "Type your message..."
              }
              disabled={loading}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !loading
                ) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              className="send-button"
              type="button"
              onClick={
                sendMessage
              }
              disabled={
                loading ||
                !message.trim()
              }
            >
              {loading
                ? "Analyzing..."
                : "Send ➤"}
            </button>
          </div>
        </main>

        <section className="agent-dashboard">
          <div className="agent-dashboard-header">
            <h2>
              📊 Agent Dashboard
            </h2>

            <span>
              ● Monitoring
            </span>
          </div>

          <div className="analysis-card">
            <h3>
              AI Analysis
            </h3>

            <div className="analysis-item">
              <span>
                😊 Sentiment
              </span>

              <strong>
                {analysis.sentiment}
              </strong>
            </div>

            <AnalysisBar
              label="Confidence"
              value={
                analysis.sentiment_percentage
              }
            />

            <div className="analysis-item">
              <span>
                🎯 Intent
              </span>

              <strong>
                {analysis.intent}
              </strong>
            </div>

            <AnalysisBar
              label="Confidence"
              value={
                analysis.intent_percentage
              }
            />

            <div className="analysis-item">
              <span>
                ⚡ Urgency
              </span>

              <strong>
                {analysis.urgency}
              </strong>
            </div>

            <AnalysisBar
              label="Confidence"
              value={
                analysis.urgency_percentage
              }
            />

            <div className="analysis-item">
              <span>
                🚨 Escalation Risk
              </span>

              <strong>
                {analysis.escalation}
              </strong>
            </div>

            <AnalysisBar
              label="Risk Level"
              value={
                analysis.escalation_percentage
              }
            />

            <div className="analysis-item">
              <span>
                🔎 Key Issue
              </span>

              <strong>
                {analysis.key_issue}
              </strong>
            </div>
          </div>

          <div className="coaching-card">
            <div className="card-header">
              <div>
                <h3>
                  💡 Agent Coaching
                </h3>

                <span className="card-subtitle">
                  AI-Powered Guidance
                </span>
              </div>
            </div>

            <div className="card-section">
              <span className="card-label">
                Recommended Approach
              </span>

              <p>
                {analysis.coaching}
              </p>
            </div>

            <div className="card-footer">
              <span>
                ● Priority:{" "}
                {String(
                  analysis.urgency
                ).toLowerCase() ===
                "high"
                  ? "High"
                  : String(
                      analysis.urgency
                    ).toLowerCase() ===
                    "medium"
                  ? "Medium"
                  : "Standard"}
              </span>
            </div>
          </div>

          <div className="coaching-card">
            <div className="card-header">
              <div>
                <h3>
                  🧑‍💼 Agent Suggestion
                </h3>

                <span className="card-subtitle">
                  AI Recommended Action
                </span>
              </div>
            </div>

            <div className="card-section">
              <span className="card-label">
                Next Best Action
              </span>

              <p>
                {analysis.suggestion}
              </p>
            </div>

            <div className="card-footer">
              <span>
                ✓ Suggested by AI
              </span>
            </div>
          </div>

          <div className="agent-control-card">
            <div className="card-header">
              <div>
                <h3>
                  👨‍💼 Support Status
                </h3>

                <span className="card-subtitle">
                  Customer Connection
                </span>
              </div>
            </div>

            {showAgent ? (
              <>
                <div className="support-status-active">
                  🟢 Live Agent Session
                  Active
                </div>

                <p>
                  Customer has been
                  successfully connected
                  with a support
                  representative.
                </p>

                <div className="support-details">
                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      Active
                    </strong>
                  </div>

                  <div>
                    <span>
                      Mode
                    </span>

                    <strong>
                      Human Support
                    </strong>
                  </div>
                </div>

                <div className="card-footer">
                  <span>
                    ● Response monitoring
                    enabled
                  </span>
                </div>
              </>
            ) : escalationTriggered ? (
              <>
                <div className="support-status-ai">
                  🚨 Human Support
                  Required
                </div>

                <p>
                  High escalation
                  risk has been
                  detected. The
                  conversation has
                  been flagged for
                  human support.
                </p>

                <div className="support-details">
                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      Escalation Required
                    </strong>
                  </div>

                  <div>
                    <span>
                      Mode
                    </span>

                    <strong>
                      Human Support
                    </strong>
                  </div>
                </div>

                <div className="card-footer">
                  <span>
                    🚨 Automatic
                    escalation
                    triggered
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="support-status-ai">
                  🟡 AI Support Active
                </div>

                <p>
                  AI is currently
                  handling the
                  conversation and
                  monitoring customer
                  interactions.
                </p>

                <div className="support-details">
                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      Active
                    </strong>
                  </div>

                  <div>
                    <span>
                      Mode
                    </span>

                    <strong>
                      AI Support
                    </strong>
                  </div>
                </div>

                <div className="card-footer">
                  <span>
                    ● AI monitoring
                    enabled
                  </span>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ChatPage;

