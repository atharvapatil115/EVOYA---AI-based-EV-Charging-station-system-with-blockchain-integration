import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# Load dataset
df = pd.read_csv("updated.csv")  # Replace with actual path

# Step 1: Create samples for all 3 time windows per station
records = []

for _, row in df.iterrows():
    threshold = 0.8 * row["Total_Slots"]
    for i, (slot_name, booked_key) in enumerate([
        ("6AM-11AM", "6AM-11AM_Booked_slots"),
        ("11AM-4PM", "11AM-4PM_Booked_slots"),
        ("4PM-10PM", "4PM-10PM_Booked_slots")
    ]):
        booked = row[booked_key]
        norm_booked = booked / row["Total_Slots"]
        label = booked <= threshold

        records.append({
            "slot_time_type": i,  # 0: Morning, 1: Afternoon, 2: Evening
            "normalized_booked_slots": norm_booked,
            "go_or_not": label
        })

# Step 2: Create new dataset
df_model = pd.DataFrame(records)

# Step 3: Train model
X = df_model[["slot_time_type", "normalized_booked_slots"]]
y = df_model["go_or_not"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

print("Unified Model Accuracy:")
print(classification_report(y_test, model.predict(X_test)))

# Step 4: Save unified model
import joblib
joblib.dump(model, "ev_unified_classifier.pkl")
