# save_model.py

import pickle
from station_recommender import ChargingStationRecommender

# Create instance
model = ChargingStationRecommender()

# Save instance to pickle (now the class is linked to station_recommender)
with open("CS_rec.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved to CS_rec.pkl")
