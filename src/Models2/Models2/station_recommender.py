# station_recommender.py

import pandas as pd
from haversine import haversine

class ChargingStationRecommender:
    def __init__(self, data_path='cleaned_ev_charging_stations.csv'):
        self.df = pd.read_csv(data_path)

    def find_nearest(self, user_lat, user_lon, n=6):
        if not (-90 <= user_lat <= 90) or not (-180 <= user_lon <= 180):
            raise ValueError("Invalid latitude or longitude values")
        
        self.df['distance'] = self.df.apply(
            lambda row: haversine(user_lat, user_lon, row['lattitude'], row['longitude']),
            axis=1
        )
        return self.df.sort_values('distance').head(n)[['name', 'state', 'city', 'address', 'lattitude', 'longitude', 'distance']]
