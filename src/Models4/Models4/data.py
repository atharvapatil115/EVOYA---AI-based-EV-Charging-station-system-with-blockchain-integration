import pandas as pd

# Load the CSV
df = pd.read_csv("Clean_indiaEV_Load_balance.csv")  # Replace with your path if local

# Function to generate labels for each slot
def generate_labels(row):
    threshold = 0.8 * row["Total_Slots"]
    return pd.Series({
        "label_6AM_11AM": row["6AM-11AM_Booked_slots"] <= threshold,
        "label_11AM_4PM": row["11AM-4PM_Booked_slots"] <= threshold,
        "label_4PM_10PM": row["4PM-10PM_Booked_slots"] <= threshold
    })

# Apply labels
labels = df.apply(generate_labels, axis=1)
df = pd.concat([df, labels], axis=1)
df.to_csv("updated.csv")