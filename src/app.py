from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from datetime import datetime, timedelta
import uuid
import sys
import os
import math
import pandas as pd

# Add project directories to Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))  # src directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'Models2')))  # Models2 directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'Models2', 'Models2')))  # Models2/Models2 directory

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Load the nearby stations model
try:
    with open(os.path.join('Models2', 'Models2', 'CS_rec.pkl'), 'rb') as file:
        nearby_model = pickle.load(file)
except ModuleNotFoundError as e:
    print(f"Module not found: {e}")
    raise Exception("Cannot load pickle file due to missing module. Ensure 'station_recommender' is available.")
except FileNotFoundError:
    print(f"Pickle file not found at {os.path.join('Models2', 'Models2', 'CS_rec.pkl')}")
    raise Exception("Pickle file not found. Check the file path.")

# Load the load balancing model
try:
    with open(os.path.join('Models2', 'Models2', 'load_balancing_model.pkl'), 'rb') as file:
        load_balancer_data = pickle.load(file)
        load_balancer = load_balancer_data['model']
        scaler = load_balancer_data['scaler']
        feature_names = load_balancer_data['feature_names']
except ModuleNotFoundError as e:
    print(f"Module not found: {e}")
    raise Exception("Cannot load load balancing model due to missing module.")
except FileNotFoundError:
    print(f"Pickle file not found at {os.path.join('Models2', 'Models2', 'load_balancing_model.pkl')}")
    raise Exception("Load balancing model file not found. Check the file path.")

# Debug: Print available methods in models
print("Available methods in nearby model:", dir(nearby_model))
print("Available methods in load balancer:", dir(load_balancer))
print("Expected feature names:", feature_names)

# Haversine formula to calculate distance between two lat/lng points
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in kilometers
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

# Determine time slot based on hour
def get_time_slot(hour):
    if 6 <= hour < 11:
        return '6AM-11AM'
    elif 11 <= hour < 16:
        return '11AM-4PM'
    elif 16 <= hour < 22:
        return '4PM-10PM'
    else:
        return None

@app.route('/api/nearby-stations', methods=['POST'])
def get_nearby_stations():
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')

        if not lat or not lng:
            return jsonify({'error': 'Latitude and longitude are required'}), 400

        print(f"Received lat: {lat}, lng: {lng}")

        try:
            stations = nearby_model.find_nearest(lat, lng)
            print(f"Model output: {stations}")
        except Exception as e:
            print(f"Error in find_nearest: {str(e)}")
            return jsonify({'error': f'Error in model.find_nearest: {str(e)}'}), 500

        if hasattr(stations, 'to_dict'):
            stations = stations.to_dict('records')
        else:
            return jsonify({'error': 'Model output is not a DataFrame'}), 500

        formatted_stations = []
        for station in stations:
            formatted_stations.append({
                'id': str(station.get('index', uuid.uuid4())),
                'name': station['name'],
                'location': f"{station['city']}, {station['state']}",
                'address': station['address'],
                'powerAvailable': station.get('powerAvailable', 50),
                'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M'),
                'pricePerKWh': station.get('pricePerKWh', '₹15.00'),
                'connectorTypes': station.get('connectorTypes', ['CCS', 'Type 2']),
                'status': station.get('status', 'Available'),
                'lat': station['lattitude'],
                'lng': station['longitude'],
                'distance': f"{station['distance']:.2f} km",
                'totalSlots': station.get('Total_Slots', 6),
                'bookedSlots6AM_11AM': station.get('6AM-11AM_Booked_slots', 0),
                'bookedSlots11AM_4PM': station.get('11AM-4PM_Booked_slots', 0),
                'bookedSlots4PM_10PM': station.get('4PM-10PM_Booked_slots', 0)
            })

        return jsonify(formatted_stations), 200
    except Exception as e:
        print(f"General error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/availability-prediction', methods=['POST'])
def get_availability_prediction():
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')

        if not lat or not lng:
            return jsonify({'error': 'Latitude and longitude are required'}), 400

        print(f"Received lat: {lat}, lng: {lng}")

        # Get nearby stations
        try:
            stations = nearby_model.find_nearest(lat, lng)
            print(f"Nearby stations: {stations}")
        except Exception as e:
            print(f"Error in find_nearest: {str(e)}")
            return jsonify({'error': f'Error in model.find_nearest: {str(e)}'}), 500

        if hasattr(stations, 'to_dict'):
            stations = stations.to_dict('records')
        else:
            return jsonify({'error': 'Model output is not a DataFrame'}), 500

        # Calculate current time and predict availability
        current_time = datetime.now()
        speed_kmph = 60  # Average speed in km/h

        formatted_stations = []
        for station in stations:
            # Calculate distance using Haversine formula
            distance_km = float(station['distance']) if isinstance(station['distance'], str) else station['distance']
            
            # Calculate travel time (hours)
            travel_time_hours = distance_km / speed_kmph
            travel_time_minutes = travel_time_hours * 60
            
            # Calculate estimated arrival time
            arrival_time = current_time + timedelta(minutes=travel_time_minutes)
            arrival_hour = arrival_time.hour + (arrival_time.minute / 60)
            
            # Determine time slot
            time_slot = get_time_slot(arrival_hour)
            if not time_slot:
                prediction = False  # Default to False if outside time slots
                print(f"Station {station['name']}: No valid time slot for hour {arrival_hour}")
            else:
                # Prepare input for load balancing model
                total_slots = station.get('Total_Slots', 6)
                booked_slots_key = f'{time_slot}_Booked_slots'
                booked_slots = station.get(booked_slots_key, 0)
                
                # Prepare input DataFrame
                input_data = pd.DataFrame({
                    'Total_Slots': [total_slots],
                    f'{time_slot}_Booked_slots': [booked_slots],
                    'time_slot': [time_slot]
                })
                
                print(f"Input data before encoding for {station['name']}: {input_data}")
                
                # Encode time_slot
                input_data = pd.get_dummies(input_data, columns=['time_slot'], prefix='time_slot')
                
                print(f"Input data after encoding for {station['name']}: {input_data}")
                
                # Ensure all feature columns are present
                for col in feature_names:
                    if col not in input_data.columns:
                        input_data[col] = 0
                
                # Reorder columns to match training
                input_data = input_data[feature_names]
                
                print(f"Final input data for {station['name']}: {input_data}")
                
                # Scale and predict
                input_scaled = scaler.transform(input_data)
                prediction = bool(load_balancer.predict(input_scaled)[0])
            
            formatted_stations.append({
                'id': str(station.get('index', uuid.uuid4())),
                'name': station['name'],
                'location': f"{station['city']}, {station['state']}",
                'address': station['address'],
                'powerAvailable': station.get('powerAvailable', 50),
                'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M'),
                'pricePerKWh': station.get('pricePerKWh', '₹15.00'),
                'connectorTypes': station.get('connectorTypes', ['CCS', 'Type 2']),
                'status': station.get('status', 'Available'),
                'lat': station['lattitude'],
                'lng': station['longitude'],
                'distance': f"{station['distance']:.2f} km",
                'totalSlots': station.get('Total_Slots', 6),
                'bookedSlots6AM_11AM': station.get('6AM-11AM_Booked_slots', 0),
                'bookedSlots11AM_4PM': station.get('11AM-4PM_Booked_slots', 0),
                'bookedSlots4PM_10PM': station.get('4PM-10PM_Booked_slots', 0),
                'recommended': prediction,
                'arrivalTime': arrival_time.strftime('%Y-%m-%d %H:%M')
            })

        return jsonify(formatted_stations), 200
    except Exception as e:
        print(f"General error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)