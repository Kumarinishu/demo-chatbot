from pathlib import Path
import pickle

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.csv"
MODEL_PATH = BASE_DIR / "model.pkl"

df = pd.read_csv(DATASET_PATH)
X = df[["times_added","risk_score"]]
y = df["risk_level"]
model = RandomForestClassifier(n_estimators=100, random_state=42).fit(X,y)


def evaluate_model():
    train_x, test_x, train_y, test_y = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    evaluation_model = RandomForestClassifier(n_estimators=100, random_state=42).fit(train_x, train_y)
    predictions = evaluation_model.predict(test_x)
    labels = sorted(y.unique())
    precision, recall, f1, support = precision_recall_fscore_support(test_y, predictions, labels=labels, zero_division=0)
    return {
        "model": "Random Forest Classifier",
        "parameters": "100 trees · random_state=42",
        "features": ["times_added", "risk_score"],
        "target": "risk_level",
        "train_rows": int(len(train_x)),
        "test_rows": int(len(test_x)),
        "accuracy": round(float(accuracy_score(test_y, predictions)) * 100, 2),
        "labels": labels,
        "class_metrics": [
            {"label": label, "precision": round(float(item_precision) * 100, 2), "recall": round(float(item_recall) * 100, 2), "f1": round(float(item_f1) * 100, 2), "support": int(item_support)}
            for label, item_precision, item_recall, item_f1, item_support in zip(labels, precision, recall, f1, support)
        ],
        "feature_importance": [
            {"feature": feature, "importance": round(float(importance) * 100, 2)}
            for feature, importance in zip(X.columns, evaluation_model.feature_importances_)
        ],
        "prediction_counts": [
            {"label": label, "actual": int((test_y == label).sum()), "predicted": int((predictions == label).sum())}
            for label in labels
        ],
    }


def forecast_customers():
    forecast = df[["customer_id", "customer_name", "place", "time_ago", "product", "times_added", "risk_score", "coupon_percent", "final_status", "revenue"]].copy()
    forecast["predicted_risk"] = model.predict(X)
    forecast["confidence"] = model.predict_proba(X).max(axis=1).round(4) * 100
    forecast["recovery_chance"] = forecast["times_added"].map({1: 22, 2: 69, 3: 84, 4: 90}).fillna(90).astype(int)
    forecast["loss_risk"] = 100 - forecast["recovery_chance"]
    forecast["forecast_status"] = forecast["times_added"].map({1: "CANCELLED", 2: "ABANDONED"}).fillna("RECOVERED")
    forecast["coupon"] = forecast["times_added"].map({1: "SAVE15", 2: "SAVE10", 3: "SAVE5", 4: "SAVE5"}).fillna("SAVE5")
    return forecast


def predict_with_coupon(t,r):
    lvl = model.predict([[t,r]])[0]
    if lvl=="HIGH": return lvl, "VIP5", 5, f"HIGH {r}% High Risk"
    elif lvl=="MEDIUM": return lvl, "SAVE12", 12, f"MEDIUM {r}%"
    else: return lvl, "FESTIVE15", 15, f"LOW {r}%"
with MODEL_PATH.open("wb") as model_file:
    pickle.dump(model, model_file)

print(f"ML model trained successfully and saved to: {MODEL_PATH}")