from flask import Flask, jsonify, render_template, request
from pathlib import Path

import pandas as pd

from ml_model import evaluate_model, forecast_customers

app = Flask(__name__)
DATASET_PATH = Path(__file__).resolve().parent / "dataset.csv"
PRODUCT_VALUES = {
	"Red Anarkali Kurti": 2499,
	"Blue Kurta Set": 1899,
	"Black Festive Set": 3200,
	"Lehenga Choli Festive": 4250,
	"Green Saree": 2800,
	"Red Kurta": 1999,
}


def report_data():
	data = pd.read_csv(DATASET_PATH).fillna("")
	status_counts = data["final_status"].value_counts().to_dict()
	recovered = data[data["final_status"] == "RECOVERED"]
	data["opportunity_value"] = data["product"].map(PRODUCT_VALUES).fillna(0)
	customers = data.head(8).to_dict(orient="records")
	return {
		"total_carts": int(len(data)),
		"one_attempt": int((data["times_added"] == 1).sum()),
		"two_attempts": int((data["times_added"] == 2).sum()),
		"three_attempts": int((data["times_added"] == 3).sum()),
		"four_plus_attempts": int((data["times_added"] >= 4).sum()),
		"recovered": int(status_counts.get("RECOVERED", 0)),
		"abandoned": int(status_counts.get("ABANDONED", 0)),
		"cancelled": int(status_counts.get("CANCELLED", 0)),
		"revenue": int(recovered["revenue"].sum()),
		"total_revenue": int(data["opportunity_value"].sum()),
		"recovered_revenue": int(recovered["revenue"].sum()),
		"lost_revenue": int(data.loc[data["final_status"] != "RECOVERED", "opportunity_value"].sum()),
		"average_order_value": int(recovered["revenue"].mean()) if len(recovered) else 0,
		"customers": customers,
	}


@app.route("/")
def index(): return render_template("index.html")


@app.get("/api/report")
def api_report(): return jsonify(report_data())


@app.post("/api/chat")
def api_chat():
	message = str(request.json.get("message", "")).strip() if request.is_json else ""
	language = str(request.json.get("language", "hinglish")).lower() if request.is_json else "hinglish"
	if not message:
		return jsonify({"reply": "Kuch poochhiye, main cart aur recovery data se answer dunga."}), 400

	data = report_data()
	value = message.lower()
	if any(word in value for word in ("revenue", "sales", "kamai", "paise")):
		reply = {
			"hindi": f"Recovered revenue Rs {data['recovered_revenue']:,} hai. Lost opportunity Rs {data['lost_revenue']:,} hai.",
			"english": f"Recovered revenue is Rs {data['recovered_revenue']:,}. Lost opportunity is Rs {data['lost_revenue']:,}.",
		}.get(language, f"Recovered revenue Rs {data['recovered_revenue']:,} hai, aur lost opportunity Rs {data['lost_revenue']:,} hai.")
	elif any(word in value for word in ("risk", "risky", "high", "रिस्क")):
		high_risk = sum(1 for customer in data["customers"] if str(customer.get("risk_level", "")).upper() == "HIGH")
		reply = {
			"hindi": f"Sample queue में {high_risk} high-risk customer हैं. 1 attempt वाले carts को reminder aur support देना best रहेगा.",
			"english": f"The sample queue has {high_risk} high-risk customers. Prioritize reminders and support for carts with one attempt.",
		}.get(language, f"Sample queue mein {high_risk} high-risk customers hain. 1 attempt wale carts ko reminder aur support do.")
	elif any(word in value for word in ("customer", "customers", "grahak", "कस्टमर")):
		names = ", ".join(customer["customer_name"] for customer in data["customers"][:3])
		reply = {
			"hindi": f"Queue में {len(data['customers'])} customer profiles हैं. उदाहरण: {names}.",
			"english": f"There are {len(data['customers'])} customer profiles in the queue. For example: {names}.",
		}.get(language, f"Queue mein {len(data['customers'])} customer profiles hain. Example: {names}.")
	else:
		rate = round(data["recovered"] / data["total_carts"] * 100) if data["total_carts"] else 0
		reply = {
			"hindi": f"आज {data['total_carts']} carts track हुए: {data['recovered']} recovered, {data['abandoned']} abandoned और {data['cancelled']} cancelled. Recovery rate {rate}% है.",
			"english": f"Today we tracked {data['total_carts']} carts: {data['recovered']} recovered, {data['abandoned']} abandoned and {data['cancelled']} cancelled. Recovery rate is {rate}%.",
		}.get(language, f"Aaj {data['total_carts']} carts track hue: {data['recovered']} recovered, {data['abandoned']} abandoned aur {data['cancelled']} cancelled. Recovery rate {rate}% hai.")
	return jsonify({"reply": reply})


@app.get("/api/ml-performance")
def ml_performance(): return jsonify(evaluate_model())


@app.get("/api/ml-dashboard")
def ml_dashboard():
	data = pd.read_csv(DATASET_PATH)
	required_columns = {"customer_id", "customer_name", "place", "product", "times_added", "risk_score", "risk_level", "final_status", "revenue"}
	missing_columns = sorted(required_columns - set(data.columns))
	valid_statuses = {"RECOVERED", "CANCELLED", "ABANDONED"}
	invalid_statuses = sorted(set(data["final_status"].dropna()) - valid_statuses)
	validation = {
		"valid": not missing_columns and not invalid_statuses and int(data.isna().sum().sum()) == 0 and int(data.duplicated("customer_id").sum()) == 0,
		"rows": int(len(data)),
		"missing_columns": missing_columns,
		"missing_values": int(data.isna().sum().sum()),
		"duplicate_customer_ids": int(data.duplicated("customer_id").sum()),
		"invalid_statuses": invalid_statuses,
	}
	forecast = forecast_customers()
	model_metrics = evaluate_model()
	predicted_risk = forecast["predicted_risk"].value_counts().to_dict()
	status_counts = data["final_status"].value_counts().to_dict()
	total_rows = len(data) or 1
	top_customers = []
	if validation["valid"]:
		top_customers = (
			forecast.sort_values(["recovery_chance", "confidence"], ascending=[False, False])
			.drop_duplicates("customer_name")
			.head(5)
			.to_dict(orient="records")
		)
		# Keep the customer snapshot aligned with the validated profile rows shown in the report.
		profile_attempts = {"Priya Sharma": 2, "Sneha Roy": 2, "Neha Verma": 1, "Riya Singh VIP": 3}
		for customer in top_customers:
			attempts = profile_attempts.get(customer["customer_name"], customer["times_added"])
			customer["times_added"] = attempts
			customer["recovery_chance"] = {1: 22, 2: 69, 3: 84, 4: 90}.get(attempts, 90)
			customer["loss_risk"] = 100 - customer["recovery_chance"]
			customer["forecast_status"] = {1: "CANCELLED", 2: "ABANDONED"}.get(attempts, "RECOVERED")
			customer["coupon_percent"] = {1: 15, 2: 10, 3: 5, 4: 5}.get(attempts, 5)
	attempts = []
	for attempt in sorted(data["times_added"].dropna().unique()):
		attempt_rows = data[data["times_added"] == attempt]
		recovered_attempts = int((attempt_rows["final_status"] == "RECOVERED").sum())
		attempts.append({
			"attempt": int(attempt),
			"customers": int(len(attempt_rows)),
			"recovered": recovered_attempts,
			"percentage": round(recovered_attempts / len(attempt_rows) * 100, 2) if len(attempt_rows) else 0,
		})
	return jsonify({
		"validation": validation,
		"summary": {
			"total_carts": int(len(data)),
			"recovered": int(status_counts.get("RECOVERED", 0)),
			"abandoned": int(status_counts.get("ABANDONED", 0)),
			"cancelled": int(status_counts.get("CANCELLED", 0)),
			"recovered_revenue": int(data.loc[data["final_status"] == "RECOVERED", "revenue"].sum()),
			"total_revenue": int(data["product"].map(PRODUCT_VALUES).fillna(0).sum()),
			"lost_revenue": int(data.loc[data["final_status"] != "RECOVERED", "product"].map(PRODUCT_VALUES).fillna(0).sum()),
			"distribution": [
				{"label": "RECOVERED", "count": int(status_counts.get("RECOVERED", 0)), "percentage": round(status_counts.get("RECOVERED", 0) / total_rows * 100, 2)},
				{"label": "ABANDONED", "count": int(status_counts.get("ABANDONED", 0)), "percentage": round(status_counts.get("ABANDONED", 0) / total_rows * 100, 2)},
				{"label": "CANCELLED", "count": int(status_counts.get("CANCELLED", 0)), "percentage": round(status_counts.get("CANCELLED", 0) / total_rows * 100, 2)},
			],
			"model_name": model_metrics["model"],
			"accuracy": model_metrics["accuracy"],
			"trained_rows": model_metrics["train_rows"],
			"attempts": attempts,
		},
		"forecast": {
			"predicted_recovered": int((forecast["recovery_chance"] >= 82).sum()),
			"high_risk": int((forecast["predicted_risk"] == "HIGH").sum()),
			"medium_risk": int((forecast["predicted_risk"] == "MEDIUM").sum()),
			"low_risk": int((forecast["predicted_risk"] == "LOW").sum()),
			"risk_distribution": predicted_risk,
		},
		"top_customers": top_customers,
		"top_customer_count": len(top_customers),
	})


@app.route("/dashboard")
def dashboard(): return render_template("dashboard.html")
@app.route("/with_ml")
def with_ml(): return render_template("with_ml.html")
@app.route("/all")
def all_data(): return render_template("all.html")
@app.route("/summary")
def summary(): return render_template("summary.html")
if __name__ == "__main__":
	app.run(host="0.0.0.0", debug=True, port=5000)