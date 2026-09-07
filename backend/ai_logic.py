

from dataclasses import dataclass, field
from typing import List
from transformers import pipeline


sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
)

intent_classifier = pipeline(
    "zero-shot-classification",
    model="valhalla/distilbart-mnli-12-1"
)


@dataclass
class ConversationState:
    history: List[dict] = field(default_factory=list)
    sentiment: str = ""
    urgency: str = ""
    escalation_risk: str = ""
    key_issue: str = ""

    def add_message(self, role: str, message: str):
        self.history.append({
            "role": role,
            "message": message
        })


@dataclass
class CoachingFeedback:
    tone_score: float
    empathy_score: float
    clarity_score: float
    coaching_tip: str


def detect_urgency(customer_message: str) -> str:

    message = customer_message.lower()

    high_urgency_keywords = [
        "urgent",
        "urgently",
        "emergency",
        "immediately",
        "right now",
        "as soon as possible",
        "critical",
        "fraud",
        "scammed",
        "money stolen",
        "account hacked",
        "payment deducted",
        "charged twice",
        "cannot access"
    ]

    medium_urgency_keywords = [
        "delay",
        "delayed",
        "late",
        "not received",
        "still waiting",
        "problem",
        "issue",
        "failed",
        "error",
        "refund",
        "cancel"
    ]

    if any(keyword in message for keyword in high_urgency_keywords):
        return "HIGH"

    if any(keyword in message for keyword in medium_urgency_keywords):
        return "MEDIUM"

    return "LOW"


def get_urgency_score(urgency: str) -> float:

    if urgency == "HIGH":
        return 90.0

    if urgency == "MEDIUM":
        return 70.0

    return 40.0


def detect_escalation_risk(
    customer_message: str,
    sentiment: str,
    urgency: str
) -> str:

    message = customer_message.lower()

    high_risk_keywords = [
        "manager",
        "supervisor",
        "legal action",
        "lawyer",
        "court",
        "consumer court",
        "police",
        "complaint",
        "fraud",
        "scam",
        "stolen",
        "chargeback",
        "sue you",
        "report your company"
    ]

    medium_risk_keywords = [
        "human agent",
        "real person",
        "talk to someone",
        "customer care",
        "support agent",
        "refund",
        "very angry",
        "extremely angry",
        "terrible service",
        "unacceptable",
        "not happy"
    ]

    if any(keyword in message for keyword in high_risk_keywords):
        return "HIGH"

    if sentiment == "NEGATIVE" and urgency == "HIGH":
        return "HIGH"

    if any(keyword in message for keyword in medium_risk_keywords):
        return "MEDIUM"

    if sentiment == "NEGATIVE":
        return "MEDIUM"

    return "LOW"


def get_escalation_score(escalation_risk: str) -> float:

    if escalation_risk == "HIGH":
        return 90.0

    if escalation_risk == "MEDIUM":
        return 65.0

    return 25.0


def identify_key_issue(
    customer_message: str,
    intent: str
) -> str:

    message = customer_message.lower()

    if "refund" in message:
        return "Refund issue"

    if "payment" in message or "paid" in message or "charged" in message:
        return "Payment issue"

    if "order" in message:
        return "Order issue"

    if "delivery" in message or "delivered" in message:
        return "Delivery issue"

    if "return" in message:
        return "Product return"

    if "cancel" in message or "cancellation" in message:
        return "Cancellation request"

    if "account" in message or "login" in message or "password" in message:
        return "Account issue"

    if (
        "technical" in message
        or "error" in message
        or "bug" in message
        or "not working" in message
    ):
        return "Technical issue"

    if intent == "complaint":
        return "Customer complaint"

    if intent == "purchase":
        return "Purchase request"

    if intent == "technical issue":
        return "Technical issue"

    if intent == "feedback":
        return "Customer feedback"

    return "Customer support request"


def generate_conversation_summary(
    customer_message,
    key_issue,
    urgency,
    escalation_risk
):

    message = customer_message.lower()

    parts = []

    if "payment" in message:
        parts.append("a payment deduction")

    if "order" in message:
        parts.append("an order confirmation issue")

    if "refund" in message:
        parts.append("a refund request")

    if "delivery" in message:
        parts.append("a delivery issue")

    if "return" in message:
        parts.append("a return request")

    if "cancel" in message:
        parts.append("a cancellation request")

    if "account" in message or "login" in message:
        parts.append("an account issue")

    if not parts:
        parts.append("a customer support issue")

    return "Customer is reporting " + ", ".join(parts) + "."


def generate_coaching_feedback(
    agent_message: str,
    customer_message: str
) -> dict:

    sentiment_result = sentiment_analyzer(customer_message)[0]

    sentiment = sentiment_result["label"]

    sentiment_score = round(
        sentiment_result["score"] * 100,
        2
    )

    intent_result = intent_classifier(
        customer_message,
        [
            "complaint",
            "query",
            "purchase",
            "technical issue",
            "feedback"
        ]
    )

    intent = intent_result["labels"][0]

    intent_score = round(
        intent_result["scores"][0] * 100,
        2
    )

    urgency = detect_urgency(customer_message)

    escalation_risk = detect_escalation_risk(
        customer_message,
        sentiment,
        urgency
    )

    key_issue = identify_key_issue(
        customer_message,
        intent
    )

    coaching = build_coaching_feedback(
        customer_message,
        sentiment,
        urgency,
        escalation_risk
    )

    return {
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "intent": intent,
        "intent_score": intent_score,
        "urgency": urgency,
        "escalation_risk": escalation_risk,
        "key_issue": key_issue,
        "coaching": coaching
    }


def calculate_agent_score(
    agent_message: str,
    customer_message: str,
    sentiment: str
) -> dict:

    message = agent_message.lower()

    empathy_words = [
        "sorry",
        "understand",
        "apologize",
        "apologies",
        "concern",
        "help",
        "appreciate"
    ]

    clarity_words = [
        "check",
        "explain",
        "step",
        "next",
        "status",
        "provide",
        "confirm"
    ]

    tone_score = 70.0
    empathy_score = 50.0
    clarity_score = 60.0

    empathy_count = sum(
        1 for word in empathy_words if word in message
    )

    clarity_count = sum(
        1 for word in clarity_words if word in message
    )

    if empathy_count > 0:
        empathy_score = min(
            95.0,
            60.0 + empathy_count * 10
        )

    if clarity_count > 0:
        clarity_score = min(
            95.0,
            65.0 + clarity_count * 7
        )

    if sentiment == "NEGATIVE":
        tone_score = 75.0

    if len(agent_message.split()) < 5:
        clarity_score = 45.0

    overall_score = round(
        (tone_score + empathy_score + clarity_score) / 3,
        2
    )

    if overall_score >= 85:
        coaching_tip = (
            "Excellent response. Maintain the same professional and empathetic approach."
        )

    elif overall_score >= 70:
        coaching_tip = (
            "Good response. Improve empathy and provide a clearer next step."
        )

    else:
        coaching_tip = (
            "Improve empathy, clarity, and provide a specific next step."
        )

    return {
        "tone_score": tone_score,
        "empathy_score": empathy_score,
        "clarity_score": clarity_score,
        "overall_score": overall_score,
        "coaching_tip": coaching_tip
    }


def create_feedback_response() -> str:
    """
    Used when a message is explicitly marked as feedback
    (e.g. sent from the Suggestion box). Skips all keyword
    matching so words like "order" or "payment" inside a
    suggestion don't get misrouted to the wrong reply.
    """

    return (
        "Thank you for sharing your feedback. "
        "We appreciate your input and will use it to improve our service."
    )


def create_ai_response(
    customer_message: str,
    intent: str,
    sentiment: str,
    urgency: str,
    escalation_risk: str
) -> str:

    message = customer_message.lower()

    if "refund" in message:

        response = (
            "I understand your concern about the refund. "
            "I will help you check the refund status and explain the next steps."
        )

    elif "payment" in message:

        response = (
            "I understand your payment concern. "
            "I will help verify the payment status and guide you through the next step."
        )

    elif "order" in message:

        response = (
            "I can help you with your order. "
            "Let me help you check the current order status."
        )

    elif "delivery" in message:

        response = (
            "I understand your delivery concern. "
            "Let me help you check the latest delivery status."
        )

    elif "return" in message:

        response = (
            "I can help you with the return request. "
            "Let me guide you through the return process."
        )

    elif "cancel" in message:

        response = (
            "I can help with your cancellation request. "
            "Let me check the available cancellation options."
        )

    elif "account" in message or "login" in message:

        response = (
            "I can help you with your account issue. "
            "Let me guide you through the steps to resolve it."
        )

    elif intent == "complaint":

        response = (
            "I understand your concern and apologize for the inconvenience. "
            "Let me help you resolve this issue."
        )

    elif intent == "technical issue":

        response = (
            "I understand that you are facing a technical issue. "
            "Let me help identify the problem and guide you toward a solution."
        )

    elif intent == "purchase":

        response = (
            "I can help you with your purchase request. "
            "Please provide the relevant order or product details."
        )

    elif intent == "feedback":

        response = (
            "Thank you for sharing your feedback. "
            "We appreciate your input and will use it to improve our service."
        )

    else:

        response = (
            "I understand your request. "
            "Let me help you find the best solution."
        )

    if escalation_risk == "HIGH":

        response += (
            " Since this appears to require additional assistance, "
            "a human support agent may need to review the case."
        )

    elif urgency == "HIGH":

        response += " I will treat this as a priority."

    return response


def create_agent_suggestion(
    customer_message: str,
    sentiment: str,
    intent: str,
    urgency: str,
    escalation_risk: str
) -> str:

    message = customer_message.lower()

    if escalation_risk == "HIGH":

        return (
            "Escalate to a human agent, acknowledge the customer's frustration, "
            "and clearly explain the next step."
        )

    if "refund" in message:

        return (
            "Check the refund status, acknowledge the concern, "
            "and clearly explain the refund timeline."
        )

    if "payment" in message:

        return (
            "Verify the payment transaction, acknowledge the concern, "
            "and explain what will happen next."
        )

    if "order" in message:

        return (
            "Check the order status and provide accurate tracking or delivery information."
        )

    if "delivery" in message:

        return (
            "Verify the latest delivery status and provide a clear expected delivery update."
        )

    if "return" in message:

        return (
            "Explain the return procedure, eligibility, and the next required step."
        )

    if "cancel" in message:

        return (
            "Confirm the cancellation request and explain whether cancellation is still possible."
        )

    if sentiment == "NEGATIVE":

        return (
            "Use empathy first, acknowledge the customer's concern, "
            "and then provide a clear solution."
        )

    if urgency == "HIGH":

        return (
            "Treat this issue as a priority and provide an immediate next step."
        )

    return (
        "Maintain a professional tone, confirm the customer's issue, "
        "and provide a clear next step."
    )


def build_coaching_feedback(
    customer_message: str,
    sentiment: str,
    urgency: str,
    escalation_risk: str
) -> str:

    feedback = []

    if sentiment == "NEGATIVE":

        feedback.append(
            "Use a calm and empathetic tone because the customer appears frustrated."
        )

    else:

        feedback.append(
            "Maintain the positive and professional tone."
        )

    if urgency == "HIGH":

        feedback.append(
            "Prioritize this issue and provide an immediate next step."
        )

    elif urgency == "MEDIUM":

        feedback.append(
            "Acknowledge the issue and clearly explain the expected resolution."
        )

    else:

        feedback.append(
            "Continue with a clear and helpful response."
        )

    if escalation_risk == "HIGH":

        feedback.append(
            "Consider transferring the conversation to a human support agent."
        )

    elif escalation_risk == "MEDIUM":

        feedback.append(
            "Monitor the customer's frustration and avoid language that may increase escalation."
        )

    return " ".join(feedback)


def ai_agent(customer_message: str, is_feedback: bool = False) -> dict:
    """
    is_feedback: set True when the message came from a dedicated
    "Suggestion" / feedback box, so it always gets a feedback-style
    reply instead of being routed by keyword matching (e.g. a
    suggestion containing the word "order" no longer gets treated
    as an order-status question).
    """

    sentiment_result = sentiment_analyzer(customer_message)[0]

    sentiment = sentiment_result["label"]

    sentiment_score = round(
        sentiment_result["score"] * 100,
        2
    )

    intent_result = intent_classifier(
        customer_message,
        [
            "complaint",
            "query",
            "purchase",
            "technical issue",
            "feedback"
        ]
    )

    top_intent = "feedback" if is_feedback else intent_result["labels"][0]

    intent_score = round(
        intent_result["scores"][0] * 100,
        2
    )

    urgency = detect_urgency(customer_message)

    urgency_score = get_urgency_score(urgency)

    escalation_risk = detect_escalation_risk(
        customer_message,
        sentiment,
        urgency
    )

    escalation_score = get_escalation_score(
        escalation_risk
    )

    key_issue = "Customer feedback" if is_feedback else identify_key_issue(
        customer_message,
        top_intent
    )

    summary = generate_conversation_summary(
        customer_message,
        key_issue,
        urgency,
        escalation_risk
    )

    if is_feedback:
        response = create_feedback_response()
    else:
        response = create_ai_response(
            customer_message,
            top_intent,
            sentiment,
            urgency,
            escalation_risk
        )

    coaching = build_coaching_feedback(
        customer_message,
        sentiment,
        urgency,
        escalation_risk
    )

    if is_feedback:
        suggestion = (
            "Acknowledge the feedback, thank the customer, "
            "and log this suggestion for the product/support team."
        )
    else:
        suggestion = create_agent_suggestion(
            customer_message,
            sentiment,
            top_intent,
            urgency,
            escalation_risk
        )

    transfer_to_human = (
        not is_feedback
        and (
            escalation_risk == "HIGH"
            or (
                urgency == "HIGH"
                and sentiment == "NEGATIVE"
            )
        )
    )

    return {
        "reply": response,
        "response": response,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "sentiment_percentage": sentiment_score,
        "intent": top_intent,
        "intent_score": intent_score,
        "intent_percentage": intent_score,
        "urgency": urgency,
        "urgency_score": urgency_score,
        "urgency_percentage": urgency_score,
        "escalation_risk": escalation_risk,
        "escalation": escalation_risk,
        "escalation_score": escalation_score,
        "escalation_percentage": escalation_score,
        "key_issue": key_issue,
        "summary": summary,
        "coaching": coaching,
        "coaching_tip": coaching,
        "suggestion": suggestion,
        "transfer_to_human": transfer_to_human
    }


def support_agent_coaching(
    agent_message: str,
    customer_message: str
) -> dict:

    analysis = generate_coaching_feedback(
        agent_message,
        customer_message
    )

    scores = calculate_agent_score(
        agent_message,
        customer_message,
        analysis["sentiment"]
    )

    return {
        "feedback": [
            analysis["coaching"]
        ],
        "sentiment": analysis["sentiment"],
        "sentiment_score": analysis["sentiment_score"],
        "urgency": analysis["urgency"],
        "escalation_risk": analysis["escalation_risk"],
        "key_issue": analysis["key_issue"],
        "tone_score": scores["tone_score"],
        "empathy_score": scores["empathy_score"],
        "clarity_score": scores["clarity_score"],
        "overall_score": scores["overall_score"],
        "coaching_tip": scores["coaching_tip"]
    }


def process_customer_message(
    customer_message: str
) -> dict:

    state = ConversationState()

    state.add_message(
        "customer",
        customer_message
    )

    result = ai_agent(customer_message)

    state.sentiment = result["sentiment"]
    state.urgency = result["urgency"]
    state.escalation_risk = result["escalation_risk"]
    state.key_issue = result["key_issue"]

    return {
        "conversation": state.history,
        "analysis": result
    }