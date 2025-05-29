from flask import Flask, request, jsonify
import pickle
import pandas as pd

app = Flask(__name__)

# Load the saved model
with open('charging_station_recommender.pkl', 'rb') as f:
    recommender = pickle.load(f)

@app.route('/nearest_stations', methods=['POST'])
def get_nearest_stations():
    try:
        # Get user coordinates from request
        data = request.get_json()
        user_lat = float(data['latitude'])
        user_lon = float(data['longitude'])
        
        # Find nearest stations
        nearest_stations = recommender.find_nearest_stations(user_lat, user_lon)
        
        # Convert to JSON-compatible format
        result = nearest_stations.to_dict(orient='records')
        
        return jsonify({
            'status': 'success',
            'stations': result
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True)