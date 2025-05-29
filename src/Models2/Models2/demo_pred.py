# demo_pred.py

import pickle
from station_recommender import ChargingStationRecommender  # important!

# Load the model
with open("CS_rec.pkl", "rb") as f:
    model = pickle.load(f)

# Use the model
result = model.find_nearest(28.4595, 77.0266)
print(result)
