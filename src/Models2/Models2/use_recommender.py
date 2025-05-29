import pickle

# Load the saved model
with open('charging_station_recommender.pkl', 'rb') as f:
    recommender = pickle.load(f)

# Example: Get user's live location (you would replace this with actual GPS data)
user_lat, user_lon = 28.4595, 77.0266  # Example: Gurugram coordinates

# Find the nearest 5 charging stations
nearest_stations = recommender.find_nearest_stations(user_lat, user_lon)

# Display results (this can be used to plot on a map in your app)
print("Nearest 5 charging stations:")
print(nearest_stations)

# Example: Prepare data for map visualization (e.g., in a web app)
map_data = nearest_stations[['name', 'lattitude', 'longitude', 'address']].to_dict(orient='records')
print("\nMap data for visualization:")
print(map_data)