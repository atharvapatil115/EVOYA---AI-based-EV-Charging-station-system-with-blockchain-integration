import pandas as pd
import numpy as np
import pickle

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on Earth (in kilometers).
    """
    # Convert latitude and longitude to radians
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    
    # Differences in coordinates
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    # Haversine formula
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    # Radius of Earth in kilometers
    r = 6371
    return c * r

class ChargingStationRecommender:
    def __init__(self, data_path='cleaned_ev_charging_stations.csv'):
        """
        Initialize the recommender with the cleaned dataset.
        """
        self.df = pd.read_csv(data_path)
    
    def find_nearest_stations(self, user_lat, user_lon, n=5):
        """
        Find the n nearest charging stations to the user's location.
        Returns a DataFrame with the nearest stations.
        """
        # Validate user input
        if not (-90 <= user_lat <= 90) or not (-180 <= user_lon <= 180):
            raise ValueError("Invalid latitude or longitude values")
        
        # Calculate distances to all stations
        self.df['distance'] = self.df.apply(
            lambda row: haversine(user_lat, user_lon, row['lattitude'], row['longitude']),
            axis=1
        )
        
        # Sort by distance and get top n
        nearest_stations = self.df.sort_values(by='distance').head(n)
        
        # Return relevant columns
        return nearest_stations[['name', 'state', 'city', 'address', 'lattitude', 'longitude', 'distance']]