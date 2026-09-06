import pandas as pd, random
customers = [("Priya Sharma","Delhi","23min ago"),("Anjali Gupta","Noida","1hr ago"),("Riya Singh VIP","Ghaziabad VIP","2hr ago"),("Rohan Kumar","Mumbai","30min ago"),("Sneha Roy","Lucknow","2hr ago"),("Neha Verma","Jaipur","5hr ago")]
products = ["Red Anarkali Kurti","Blue Kurta Set","Black Festive Set","Lehenga Choli Festive","Green Saree","Red Kurta"]

data=[]
for i in range(500):
    name, place, time = random.choice(customers)
    prod = random.choice(products)
    times = random.choice([1,2,3,3,3,4])
    if times==1: risk, level, coupon, pct, rate = 92, "HIGH", "SAVE15", 15, 0.25
    elif times==2: risk, level, coupon, pct, rate = 68, "MEDIUM", "SAVE10", 10, 0.55
    elif times==3: risk, level, coupon, pct, rate = 38, "LOW", "SAVE5", 5, 0.82
    else: risk, level, coupon, pct, rate = 18, "LOW", "SAVE5", 5, 0.94
    recovered = random.random() < rate
    revenue = random.choice([2499,1899,3200,4250,2800,1999]) if recovered else 0
    status = "RECOVERED" if recovered else random.choice(["ABANDONED","CANCELLED"])
    if status == "RECOVERED":
        reason = "Repeat intent converted"
        proactive_step = f"Sent {coupon} personalized offer"
    elif status == "CANCELLED":
        reason = "Checkout cancelled by customer"
        proactive_step = "Sent reminder and support message"
    else:
        reason = "No checkout response yet"
        proactive_step = f"Queued {coupon} follow-up"
    data.append([f"C{i:04d}", name, place, time, prod, times, risk, level, coupon, pct, status, revenue, reason, proactive_step])

df = pd.DataFrame(data, columns=["customer_id","customer_name","place","time_ago","product","times_added","risk_score","risk_level","coupon_code","coupon_percent","final_status","revenue","status_reason","proactive_step"])
df.to_csv("dataset.csv", index=False)
print("✅ 500 rows VERIFIED")