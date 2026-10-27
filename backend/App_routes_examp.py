from flask import Flask, jsonify, request
from order_db import (
    check_connection,
    get_all_orders,
    get_order_by_id,
    create_order,
    update_order_status,
    delete_order,
)
 
app = Flask(__name__)
 
# Run once at startup to confirm Atlas connection works
check_connection()
 
 
@app.route("/api/orders", methods=["GET"])
def api_get_all_orders():
    return jsonify(get_all_orders())
 
 
@app.route("/api/orders/<order_id>", methods=["GET"])
def api_get_order(order_id):
    order = get_order_by_id(order_id)
    if order is None:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order)
 
 
@app.route("/api/orders", methods=["POST"])
def api_create_order():
    data = request.json
    order = create_order(
        order_id=data["order_id"],
        customer_name=data["customer_name"],
        status=data.get("status", "placed"),
    )
    return jsonify(order), 201
 
 
@app.route("/api/orders/<order_id>", methods=["PUT"])
def api_update_order(order_id):
    data = request.json
    updated = update_order_status(order_id, data["status"])
    if not updated:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"message": "Order updated"})
 
 
@app.route("/api/orders/<order_id>", methods=["DELETE"])
def api_delete_order(order_id):
    deleted = delete_order(order_id)
    if not deleted:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"message": "Order deleted"})
 
 
if __name__ == "__main__":
    app.run(debug=True)
 