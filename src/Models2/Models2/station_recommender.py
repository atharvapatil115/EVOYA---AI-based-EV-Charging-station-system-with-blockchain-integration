import pandas as pd
from haversine import haversine
import pickle
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class ChargingStationRecommender:
    def __init__(self, data_path='balanced_dataset.csv'):
        """
        Initialize the recommender with station data from a CSV file.
        """
        try:
            self.df = pd.read_csv(data_path)
            logging.info(f"Loaded dataset with shape: {self.df.shape}")
            logging.info(f"Dataset columns: {self.df.columns.tolist()}")
        except FileNotFoundError:
            logging.error(f"Dataset file not found: {data_path}")
            raise

        # Validate required columns
        required_columns = [
            'name', 'state', 'city', 'address', 'lattitude', 'longitude',
            'Total_Slots', '6AM-11AM_Booked_slots', '11AM-4PM_Booked_slots',
            '4PM-10PM_Booked_slots'
        ]
        missing_cols = [col for col in required_columns if col not in self.df.columns]
        if missing_cols:
            logging.error(f"Missing columns: {missing_cols}")
            raise ValueError(f"Missing columns: {missing_cols}")

        # Validate data
        if (self.df['Total_Slots'] <= 0).any():
            logging.warning("Some stations have Total_Slots <= 0")
        for slot in ['6AM-11AM_Booked_slots', '11AM-4PM_Booked_slots', '4PM-10PM_Booked_slots']:
            if (self.df[slot] < 0).any():
                logging.error(f"Negative booked slots in {slot}")
                raise ValueError(f"Negative booked slots in {slot}")
            if (self.df[slot] > self.df['Total_Slots']).any():
                logging.warning(f"{slot} exceeds Total_Slots in some rows")

    def find_nearest(self, user_lat, user_lon, n=6):
        """
        Find the nearest n stations to the given latitude and longitude.
        Returns a DataFrame with all relevant station details and distances.
        """
        if not (-90 <= user_lat <= 90) or not (-180 <= user_lon <= 180):
            raise ValueError("Invalid latitude or longitude values")
        
        try:
            self.df['distance'] = self.df.apply(
                lambda row: haversine(user_lat, user_lon, row['lattitude'], row['longitude']),
                axis=1
            )
            nearest_stations = self.df.sort_values('distance').head(n).copy()
            logging.info(f"Found {len(nearest_stations)} nearest stations for lat={user_lat}, lng={user_lon}")
            # Log all columns safely
            logging.info(f"Nearest stations data sample:\n{nearest_stations.to_string()}")
            return nearest_stations
        except Exception as e:
            logging.error(f"Error in find_nearest: {str(e)}")
            raise

def save_model(dataset_path="balanced_dataset.csv"):
    """
    Create and save the ChargingStationRecommender model to CS_rec.pkl.
    """
    try:
        model = ChargingStationRecommender(dataset_path)
        os.makedirs('Models2/Models2', exist_ok=True)
        model_path = 'Models2/Models2/CS_rec.pkl'
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        logging.info(f"Model saved to {model_path}")
    except Exception as e:
        logging.error(f"Error saving model: {str(e)}")
        raise

if __name__ == '__main__':
    # Generate CS_rec.pkl using the updated dataset
    save_model(dataset_path="balanced_dataset.csv")