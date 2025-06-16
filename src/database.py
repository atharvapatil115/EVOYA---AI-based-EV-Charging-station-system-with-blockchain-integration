import pymongo
from bson.objectid import ObjectId

def insert_user(data):
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["auth_db"]
    users_collection = db["users"]
    
    try:
        # Convert batteryCapacity and avgDailyDistance to float
        battery_capacity = float(data["batteryCapacity"])
        avg_daily_distance = float(data["avgDailyDistance"])
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid numeric value for batteryCapacity or avgDailyDistance: {str(e)}")
    
    user_data = {
        "name": data["name"],
        "email": data["email"].lower(),  # Store email in lowercase
        "phone": data["phone"],
        "evModel": data["evModel"],
        "batteryCapacity": battery_capacity,
        "preferredConnector": data["preferredConnector"],
        "avgDailyDistance": avg_daily_distance,
        "password": data["password"],
        "userType": data["userType"],
        "status": "approved"  # Set to approved for testing
    }
    
    result = users_collection.insert_one(user_data)
    return str(result.inserted_id)

def insert_provider(data):
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["auth_db"]
    providers_collection = db["providers"]
    
    provider_data = {
        "name": data["name"],
        "phone": data["phone"],
        "email": data["email"].lower(),  # Store email in lowercase
        "address": data["address"],
        "openingTime": data["openingTime"],
        "closingTime": data["closingTime"],
        "chargingCapacity": data["chargingCapacity"],
        "stationType": data["stationType"],
        "location": data["location"],
        "connectorTypes": data["connectorTypes"],
        "password": data["password"],
        "userType": "provider",
        "status": "approved"  # Set to approved for testing
    }
    
    result = providers_collection.insert_one(provider_data)
    return str(result.inserted_id)