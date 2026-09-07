
from flask import Flask, request, jsonify
from flask_cors import CORS
from pypdf import PdfReader
from ai_logic import ai_agent
import re

app = Flask(__name__)

CORS(app)

ORDERS = {
    "ORD12345": {
        "status": "Shipped",
        "date": "2026-08-28",
        "items": "Wireless Headphones x1",
        "expected": "2026-09-06",
        "location": "Indore Delivery Hub"
    },
    "ORD98765": {
        "status": "Delayed",
        "date": "2026-09-02",
        "items": "Running Shoes x1",
        "expected": "2026-09-07",
        "location": "Bhopal Sorting Center"
    },
    "ORD55555": {
        "status": "Delivered",
        "date": "2026-08-15",
        "items": "Coffee Maker x1",
        "expected": "2026-08-20",
        "location": "Indore"
    }
}


@app.route("/")
def home():
    return "AI Customer Support Backend is running!"


def get_order_id(message):
    match = re.search(
        r"\bORD\d+\b",
        message.upper()
    )

    if match:
        return match.group(0)

    return None


def order_response(order_id, order):
    """
    Returns the SAME FLAT SHAPE as ai_agent(), so the frontend's
    updateAnalysis(data) can read data.sentiment, data.coaching,
    data.suggestion, etc. directly instead of nested under "analysis".
    """

    status = order["status"]

    if status == "Delayed":
        reply = (
            f"Your order {order_id} for {order['items']} "
            f"is currently delayed. It is currently at "
            f"{order['location']}. The updated expected "
            f"delivery date is {order['expected']}."
        )
    elif status == "Shipped":
        reply = (
            f"Your order {order_id} for {order['items']} "
            f"is currently shipped. It is at "
            f"{order['location']} and is expected to be "
            f"delivered by {order['expected']}."
        )
    elif status == "Delivered":
        reply = (
            f"Your order {order_id} for {order['items']} "
            f"has been delivered. The expected delivery "
            f"date was {order['expected']}."
        )
    else:
        reply = (
            f"Your order {order_id} is currently "
            f"{status.lower()}."
        )

    is_delayed = status == "Delayed"

    sentiment = "NEUTRAL"
    sentiment_percentage = 90.0

    urgency = "HIGH" if is_delayed else "LOW"
    urgency_percentage = 90.0 if is_delayed else 40.0

    escalation_risk = "HIGH" if is_delayed else "LOW"
    escalation_percentage = 85.0 if is_delayed else 25.0

    key_issue = (
        "Order delayed"
        if is_delayed
        else "Order status inquiry"
    )

    coaching = (
        "Apologize for the delay, explain the current "
        "location and provide the updated delivery date."
        if is_delayed
        else "Confirm the order status and expected delivery date."
    )

    suggestion = (
        "Offer further assistance or escalate to a human "
        "support agent if the customer is dissatisfied."
        if is_delayed
        else "Confirm that the customer has received the order status."
    )

    return {
        "reply": reply,
        "response": reply,
        "sentiment": sentiment,
        "sentiment_percentage": sentiment_percentage,
        "intent": "Order Tracking",
        "intent_percentage": 98.0,
        "urgency": urgency,
        "urgency_percentage": urgency_percentage,
        "escalation_risk": escalation_risk,
        "escalation": escalation_risk,
        "escalation_percentage": escalation_percentage,
        "key_issue": key_issue,
        "coaching": coaching,
        "coaching_tip": coaching,
        "suggestion": suggestion,
        "transfer_to_human": is_delayed,
        "order_id": order_id,
        "order": order
    }


@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data received"
        }), 400

    user_message = data.get(
        "message",
        ""
    ).strip()

    is_feedback = bool(
        data.get(
            "is_feedback",
            False
        )
    )

    if not user_message:
        return jsonify({
            "error": "Message is required"
        }), 400

    try:

        order_id = data.get("order_id")

        if not order_id:
            order_id = get_order_id(
                user_message
            )

        if order_id and order_id in ORDERS:
            return jsonify(
                order_response(
                    order_id,
                    ORDERS[order_id]
                )
            ), 200

        result = ai_agent(
            user_message,
            is_feedback=is_feedback
        )

        return jsonify(result), 200

    except Exception as e:

        print("Error:", str(e))

        return jsonify({
            "error": "AI processing failed",
            "details": str(e)
        }), 500


@app.route("/upload", methods=["POST"])
def upload():

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]
    filename = file.filename

    if not filename:
        return jsonify({
            "error": "No file selected"
        }), 400

    ext = (
        filename.rsplit(".", 1)[-1].lower()
        if "." in filename
        else ""
    )

    extracted_text = ""

    try:

        if ext == "pdf":

            reader = PdfReader(file)

            for page in reader.pages:
                text = page.extract_text()

                if text:
                    extracted_text += (
                        text + "\n"
                    )

            extracted_text = extracted_text.strip()

            if not extracted_text:
                extracted_text = (
                    "Could not extract readable text "
                    "from this PDF."
                )

        elif ext in [
            "png",
            "jpg",
            "jpeg",
            "webp"
        ]:

            extracted_text = (
                f"Customer uploaded an image file "
                f"named '{filename}'."
            )

        else:

            return jsonify({
                "error": (
                    "Unsupported file type. Please upload "
                    "a PDF or an image."
                )
            }), 400

        message_for_ai = extracted_text[:1500]

        result = ai_agent(
            message_for_ai
        )

        result["filename"] = filename
        result["extracted_text"] = extracted_text

        return jsonify(result), 200

    except Exception as e:

        print(
            "Upload error:",
            str(e)
        )

        return jsonify({
            "error": "File processing failed",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False
    )