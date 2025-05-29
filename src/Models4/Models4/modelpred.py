# Re-import necessary packages due to session reset
import joblib
import numpy as np

# Load the saved model (re-upload needed in real case, path adjusted)
model_path = "ev_unified_classifier.pkl"
# This will fail here unless the file is re-uploaded after reset

# Dummy model interface for demonstration (since model file was reset)
class DummyModel:
    def predict(self, X):
        return [x[1] <= 0.8 for x in X]  # mimic logic: go if less than 80% booked

model = DummyModel()

# Custom input example
slot_time_type = 1  # 11AM–4PM
total_slots = 8
booked_slots = 5
normalized_booked_slots = booked_slots / total_slots

# Input for prediction
input_data = np.array([[slot_time_type, normalized_booked_slots]])
prediction = model.predict(input_data)[0]
print(prediction)
