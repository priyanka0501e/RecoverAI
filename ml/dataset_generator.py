import os
import random
import csv
import json
import sqlite3
from datetime import datetime, timedelta

def generate_synthetic_data(num_records=10000, seed=42):
    random.seed(seed)
    
    first_names = ["Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Rohan", "Kavya", "Aarav", "Meera",
                   "Dev", "Isha", "Aditya", "Riya", "Karan", "Pooja", "Siddharth", "Neha", "Varun", "Simran",
                   "Manish", "Deepika", "Amit", "Swati", "Suresh", "Lakshmi", "Rajesh", "Nisha", "Gaurav", "Divya"]
    last_names = ["Sharma", "Verma", "Patel", "Rao", "Gupta", "Nair", "Singh", "Kumar", "Joshi", "Mehta",
                  "Deshmukh", "Reddy", "Chopra", "Iyer", "Sen", "Bhat", "Shah", "Kulkarni", "Das", "Menon"]

    failure_reasons = [
        "BANK_TIMEOUT",
        "INSUFFICIENT_FUNDS",
        "CARD_EXPIRED",
        "NETWORK_ERROR",
        "CHECKOUT_ABANDONED",
        "AUTHENTICATION_FAILED"
    ]
    
    payment_methods = ["UPI", "CARD", "NET_BANKING", "WALLET"]
    
    records = []
    customers_dict = {}
    
    # Pre-generate 2,000 customer profiles
    for i in range(2000):
        c_id = f"CUST-{10000 + i}"
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{random.randint(10,999)}@gmail.com"
        phone = f"+9198{random.randint(10000000, 99999999)}"
        tenure = random.randint(5, 730)
        total_p = random.randint(1, 50)
        
        # Customer loyalty / past success rate
        tier = random.choices(["high", "medium", "low"], weights=[0.5, 0.35, 0.15])[0]
        if tier == "high":
            success_rate = random.uniform(0.75, 0.98)
        elif tier == "medium":
            success_rate = random.uniform(0.45, 0.74)
        else:
            success_rate = random.uniform(0.1, 0.44)
            
        succ_p = int(total_p * success_rate)
        fail_p = total_p - succ_p
        
        customers_dict[c_id] = {
            "id": c_id,
            "name": name,
            "email": email,
            "phone": phone,
            "total_payments": total_p,
            "successful_payments": succ_p,
            "failed_payments": fail_p,
            "customer_tenure_days": tenure,
            "success_rate": round(success_rate, 4)
        }

    cust_ids = list(customers_dict.keys())
    
    start_date = datetime.now() - timedelta(days=90)
    
    for i in range(1, num_records + 1):
        payment_id = f"RP{10000 + i}"
        c_id = random.choice(cust_ids)
        cust = customers_dict[c_id]
        
        # Payment amount distribution (mostly ₹500 to ₹15,000, occasionally up to ₹75,000)
        amount_tier = random.choices(["small", "medium", "high", "enterprise"], weights=[0.45, 0.35, 0.15, 0.05])[0]
        if amount_tier == "small":
            amount = round(random.uniform(299, 2999), 2)
        elif amount_tier == "medium":
            amount = round(random.uniform(3000, 14999), 2)
        elif amount_tier == "high":
            amount = round(random.uniform(15000, 35000), 2)
        else:
            amount = round(random.uniform(35001, 85000), 2)
            
        failure_reason = random.choices(
            failure_reasons, 
            weights=[0.35, 0.20, 0.08, 0.17, 0.12, 0.08]
        )[0]
        
        payment_method = random.choices(
            payment_methods, 
            weights=[0.55, 0.25, 0.12, 0.08]
        )[0]
        
        retry_count = random.choices([0, 1, 2, 3], weights=[0.6, 0.25, 0.1, 0.05])[0]
        created_at = start_date + timedelta(seconds=random.randint(0, 90 * 86400))
        hour_of_day = created_at.hour
        
        # Calculate recovery probability based on domain features
        prob = 0.50
        if failure_reason in ["BANK_TIMEOUT", "NETWORK_ERROR"]:
            prob += 0.28
        elif failure_reason in ["CHECKOUT_ABANDONED", "AUTHENTICATION_FAILED"]:
            prob += 0.12
        elif failure_reason == "INSUFFICIENT_FUNDS":
            prob -= 0.15
        elif failure_reason == "CARD_EXPIRED":
            prob -= 0.35
            
        if cust["success_rate"] > 0.7:
            prob += 0.18
        elif cust["success_rate"] < 0.3:
            prob -= 0.20
            
        if retry_count == 0:
            prob += 0.10
        elif retry_count >= 2:
            prob -= 0.25
            
        if amount > 25000:
            prob -= 0.15
            
        prob = max(0.05, min(0.95, prob))
        is_recovered = 1 if random.random() < prob else 0
        
        records.append({
            "payment_id": payment_id,
            "customer_id": c_id,
            "customer_name": cust["name"],
            "customer_email": cust["email"],
            "amount": amount,
            "failure_reason": failure_reason,
            "payment_method": payment_method,
            "retry_count": retry_count,
            "customer_tenure_days": cust["customer_tenure_days"],
            "customer_success_rate": cust["success_rate"],
            "hour_of_day": hour_of_day,
            "created_at": created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "recovery_prob_true": round(prob, 4),
            "is_recovered": is_recovered
        })

    return customers_dict, records

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    custs, recs = generate_synthetic_data(10000)
    
    csv_path = os.path.join(out_dir, "transactions_10k.csv")
    fieldnames = list(recs[0].keys())
    
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(recs)
        
    print(f"Generated {len(recs)} synthetic transactions to {csv_path}")
