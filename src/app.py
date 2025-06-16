from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
from datetime import datetime
import uuid
import sys
import os
import math
import traceback
import pymongo
from bson.objectid import ObjectId
from database import insert_user, insert_provider
import numpy as np
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'EVOYA52025'

# Configure CORS
CORS(app, origins="http://localhost:5173", supports_credentials=True)

# Add project directories to Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'Models2')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'Models2', 'Models2')))

# Import ChargingStationRecommender
try:
    from Models2.Models2.station_recommender import ChargingStationRecommender
except ImportError as e:
    logger.error(f"Error importing ChargingStationRecommender: {e}")
    raise

# Load the nearby stations model
try:
    with open(os.path.join('Models2', 'Models2', 'CS_rec.pkl'), 'rb') as file:
        nearby_model = pickle.load(file)
except ModuleNotFoundError as e:
    logger.error(f"Module not found: {e}")
    raise Exception("Cannot load pickle file due to missing module. Ensure 'station_recommender' is available.")
except FileNotFoundError:
    logger.error(f"Pickle file not found at {os.path.join('Models2', 'Models2', 'CS_rec.pkl')}")
    raise Exception("Pickle file not found. Check the file path.")
except Exception as e:
    logger.error(f"Error loading CS_rec.pkl: {e}")
    raise

# Load the load balancing model
try:
    with open(os.path.join('Models2', 'Models2', 'load_balancing_model.pkl'), 'rb') as file:
        load_balancer_data = pickle.load(file)
        load_balancer = load_balancer_data['model']
        scaler = load_balancer_data['scaler']
        feature_names = load_balancer_data['feature_names']
except FileNotFoundError:
    logger.error(f"Pickle file not found at {os.path.join('Models2', 'Models2', 'load_balancing_model.pkl')}")
    raise Exception("Load balancing model file not found. Check the file path.")
except Exception as e:
    logger.error(f"Error loading load_balancing_model.pkl: {e}")
    raise

# Debug: Log available methods in models
logger.debug("Available methods in nearby model: %s", dir(nearby_model))
logger.debug("Available methods in load balancer: %s", dir(load_balancer))
logger.debug("Expected feature names: %s", feature_names)

# Haversine formula to calculate distance
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
        return '11AM-4PM'

@app.route('/api/current-user', methods=['GET', 'OPTIONS'])
def get_current_user():
    logger.debug(f"Handling {request.method} /api/current-user")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    return jsonify({
        "user_id": "demo123",
        "name": "Gojo Satoru",
        "userType": "user"
    }), 200

@app.route('/api/signin', methods=['POST', 'OPTIONS'])
def signin():
    logger.debug(f"Handling {request.method} /api/signin")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        email = data.get('email').lower()
        password = data.get('password')
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["auth_db"]
        
        logger.debug(f"Searching for email: {email}")
        user = db.users.find_one({"email": email})
        logger.debug(f"User in users collection: {user}")
        
        if not user:
            user = db.providers.find_one({"email": email})
            logger.debug(f"User in providers collection: {user}")
        
        if not user:
            logger.debug(f"No user found for email: {email}")
            return jsonify({"error": "User not found. Please register."}), 404
        
        if password != user["password"]:
            logger.debug(f"Password mismatch for email: {email}")
            return jsonify({"error": "Incorrect password."}), 401
        
        if user.get("status") != "approved":
            logger.debug(f"User {email} not approved, status: {user.get('status')}")
            return jsonify({"error": "Account is not approved yet."}), 403
        
        logger.debug(f"Login successful for email: {email}, userType: {user['userType']}")
        return jsonify({
            "message": "Login successful",
            "user_id": str(user["_id"]),
            "userType": user["userType"],
            "name": user["name"]
        }), 200
    
    except Exception as e:
        logger.error(f"Error in signin: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/signout', methods=['POST', 'OPTIONS'])
def signout():
    logger.debug(f"Handling {request.method} /api/signout")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    return jsonify({"message": "Signed out successfully"}), 200

@app.route('/api/update-user-type', methods=['POST', 'OPTIONS'])
def update_user_type():
    logger.debug(f"Handling {request.method} /api/update-user-type")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        user_id = data.get('userId')
        user_type = data.get('userType')
        if not user_id or not user_type:
            return jsonify({"error": "userId and userType are required"}), 400
        
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["auth_db"]
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"userType": user_type}})
        else:
            provider = db.providers.find_one({"_id": ObjectId(user_id)})
            if provider:
                db.providers.update_one({"_id": ObjectId(user_id)}, {"$set": {"userType": user_type}})
            else:
                return jsonify({"error": "User not found"}), 404
        
        return jsonify({"message": "User type updated successfully"}), 200
    except Exception as e:
        logger.error(f"Error in update_user_type: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/update-provider-type', methods=['POST', 'OPTIONS'])
def update_provider_type():
    logger.debug(f"Handling {request.method} /api/update-provider-type")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        user_id = data.get('userId')
        provider_type = data.get('providerType')
        if not user_id or not provider_type:
            return jsonify({"error": "userId and providerType are required"}), 400
        
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["auth_db"]
        
        provider = db.providers.find_one({"_id": ObjectId(user_id)})
        if provider:
            db.providers.update_one({"_id": ObjectId(user_id)}, {"$set": {"providerType": provider_type}})
        else:
            return jsonify({"error": "Provider not found"}), 404
        
        return jsonify({"message": "Provider type updated successfully"}), 200
    except Exception as e:
        logger.error(f"Error in update_provider_type: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['POST', 'OPTIONS'])
def create_user():
    logger.debug(f"Handling {request.method} /api/users")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        required_fields = ['name', 'email', 'phone', 'evModel', 'batteryCapacity', 
                          'preferredConnector', 'avgDailyDistance', 'password', 'userType']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({"error": f"Missing or null required field: {field}"}), 400
        
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["auth_db"]
        if db.users.find_one({"email": data["email"].lower()}):
            return jsonify({"error": "Email already exists"}), 400
        
        user_id = insert_user(data)
        logger.debug(f"User created with ID: {user_id}")
        return jsonify({"message": "User created successfully", "user_id": user_id}), 201
    except Exception as e:
        logger.error(f"Error in create_user: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/stations', methods=['POST', 'OPTIONS'])
def create_station():
    logger.debug(f"Handling {request.method} /api/stations")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        data = request.get_json()
        logger.debug(f"Received data: {data}")
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        required_fields = ['name', 'phone', 'email', 'address', 'openingTime', 
                          'closingTime', 'chargingCapacity', 'stationType', 'location', 
                          'connectorTypes', 'password', 'userType']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({"error": f"Missing or null required field: {field}"}), 400
        
        if not isinstance(data['location'], dict) or 'lat' not in data['location'] or 'lng' not in data['location']:
            return jsonify({"error": "Invalid or missing location data"}), 400
        
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["auth_db"]
        if db.providers.find_one({"email": data["email"].lower()}):
            return jsonify({"error": "Email already exists"}), 400
        
        provider_id = insert_provider(data)
        logger.debug(f"Provider created with ID: {provider_id}")
        return jsonify({"message": "Provider created successfully", "provider_id": provider_id}), 201
    except Exception as e:
        logger.error(f"Error in create_station: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/nearby-stations', methods=['POST', 'OPTIONS'])
def find_nearest():
    logger.debug(f"Handling {request.method} /api/nearby-stations")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        if not lat or not lng:
            return jsonify({"error": "Latitude and longitude are required"}), 400
        
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client["auth_db"]
        stations = db.providers.find({"location": {"$exists": True}})
        
        formatted_stations = []
        for station in stations:
            station_lat = station['location']['lat']
            station_lng = station['location']['lng']
            distance = haversine(lat, lng, station_lat, station_lng)
            if distance <= 50:
                formatted_stations.append({
                    "id": str(station['_id']),
                    "name": station.get('stationName', station['name']),
                    "distance": round(distance, 2),
                    "lat": station_lat,
                    "lng": station_lng,
                    "type": station.get('stationType'),
                    "connectors": station.get('connectorTypes', []),
                    "capacity": station.get('chargingCapacity')
                })
        
        return jsonify(formatted_stations), 200
    except Exception as e:
        logger.error(f"Error in find_nearest: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/availability-prediction', methods=['POST', 'OPTIONS'])
def get_availability_prediction():
    logger.debug(f"Handling {request.method} /api/availability-prediction")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        if not lat or not lng:
            return jsonify({"error": "Latitude and longitude are required"}), 400
        
        # Get predictions from the model
        stations = nearby_model.find_nearest(lat, lng)
        logger.debug(f"Model returned type: {type(stations)}")
        logger.debug(f"Model returned content: {stations.to_dict('records') if isinstance(stations, pd.DataFrame) else stations}")
        
        # Initialize formatted stations
        formatted_stations = []
        
        # Handle DataFrame output
        if isinstance(stations, pd.DataFrame):
            if stations.empty:
                logger.info("No stations returned by model")
                return jsonify({"message": "No stations found for the given location"}), 200
            
            logger.debug("Handling DataFrame from model")
            for _, station in stations.iterrows():
                # Determine time slot for recommendation
                hour = datetime.now().hour
                time_slot = get_time_slot(hour)
                booked_slots = {
                    '6AM-11AM': station.get('6AM-11AM_Booked_slots', 0),
                    '11AM-4PM': station.get('11AM-4PM_Booked_slots', 0),
                    '4PM-10PM': station.get('4PM-10PM_Booked_slots', 0)
                }.get(time_slot, 0)
                
                # Predict recommendation
                try:
                    total_slots = float(station.get('Total_Slots', 0))
                    input_data = {
                        'total_slots': total_slots,
                        'booked_slots': float(booked_slots),
                        'booking_ratio': booked_slots / total_slots if total_slots > 0 else 0,
                        'time_slot_6AM-11AM': 1 if time_slot == '6AM-11AM' else 0,
                        'time_slot_11AM-4PM': 1 if time_slot == '11AM-4PM' else 0,
                        'time_slot_4PM-10PM': 1 if time_slot == '4PM-10PM' else 0
                    }
                    input_array = np.zeros(len(feature_names))
                    for i, feature in enumerate(feature_names):
                        input_array[i] = input_data.get(feature, 0)
                    input_array = input_array.reshape(1, -1)
                    scaled_input = scaler.transform(input_array)
                    recommended = bool(load_balancer.predict(scaled_input)[0])
                except Exception as e:
                    logger.error(f"Error predicting recommendation: {str(e)}")
                    recommended = False
                
                formatted_stations.append({
                    "id": str(uuid.uuid4()),
                    "name": station.get('name', 'Unknown'),
                    "distance": float(station.get('distance', 0.0)),
                    "lat": float(station.get('lattitude', lat)),
                    "lng": float(station.get('longitude', lng)),
                    "availability": "Available" if station.get('Total_Slots', 0) > max(
                        station.get('6AM-11AM_Booked_slots', 0),
                        station.get('11AM-4PM_Booked_slots', 0),
                        station.get('4PM-10PM_Booked_slots', 0)
                    ) else "Full",
                    "connectorTypes": ["CCS", "Type 2"],  # Sample data
                    "location": f"{station.get('city', 'Unknown')}, {station.get('state', 'Unknown')}",
                    "address": station.get('address', 'Unknown'),
                    "powerAvailable": 50,  # Sample data
                    "lastUpdated": datetime.now().isoformat(),
                    "pricePerKWh": "₹15.00",  # Sample data
                    "status": "Available",
                    "totalSlots": int(station.get('Total_Slots', 0)),
                    "bookedSlots6AM_11AM": int(station.get('6AM-11AM_Booked_slots', 0)),
                    "bookedSlots11AM_4PM": int(station.get('11AM-4PM_Booked_slots', 0)),
                    "bookedSlots4PM_10PM": int(station.get('4PM-10PM_Booked_slots', 0)),
                    "recommended": recommended,
                    "weatherSafe": True
                })
        else:
            logger.error(f"Model returned unexpected type: {type(stations)}")
            return jsonify({"error": f"Unexpected model output type: {type(stations)}"}), 500
        
        logger.debug(f"Formatted stations: {formatted_stations}")
        return jsonify(formatted_stations), 200
    except Exception as e:
        logger.error(f"Error in get_availability_prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/test_prediction', methods=['POST', 'OPTIONS'])
def test_prediction():
    logger.debug(f"Handling {request.method} /api/test_prediction")
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        data = request.get_json()
        total_slots = float(data.get('total_slots', 9))
        booked_slots = float(data.get('booked_slots', 8))
        time_slot = data.get('time_slot', '11AM-4PM')
        
        if total_slots <= 0:
            return jsonify({"error": "Total slots must be greater than 0"}), 400
        
        booking_ratio = booked_slots / total_slots
        input_data = {
            'total_slots': total_slots,
            'booked_slots': booked_slots,
            'booking_ratio': booking_ratio,
            'time_slot_6AM-11AM': 1 if time_slot == '6AM-11AM' else 0,
            'time_slot_11AM-4PM': 1 if time_slot == '11AM-4PM' else 0,
            'time_slot_4PM-10PM': 1 if time_slot == '4PM-10PM' else 0
        }
        
        # Ensure all feature_names are present
        input_array = np.zeros(len(feature_names))
        for i, feature in enumerate(feature_names):
            input_array[i] = input_data.get(feature, 0)
        
        # Reshape for scaler
        input_array = input_array.reshape(1, -1)
        scaled_input = scaler.transform(input_array)
        prediction = load_balancer.predict(scaled_input)[0]
        
        return jsonify({
            'total_slots': total_slots,
            'booked_slots': booked_slots,
            'booking_ratio': booking_ratio,
            'time_slot': time_slot,
            'recommended': bool(prediction)
        }), 200
    except Exception as e:
        logger.error(f"Error in test_prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)