import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE
import pickle
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load data
try:
    data = pd.read_csv("updated.csv")
    logging.info(f"Loaded dataset with shape: {data.shape}")
except FileNotFoundError:
    logging.error("updated.csv not found")
    raise

# Function to determine time slot based on hour
def get_time_slot(hour):
    if 6 <= hour < 11:
        return '6AM-11AM'
    elif 11 <= hour < 16:
        return '11AM-4PM'
    elif 16 <= hour < 22:
        return '4PM-10PM'
    else:
        return None

# Validate dataset
def validate_data(data):
    required_columns = [
        'Total_Slots', '6AM-11AM_Booked_slots', '11AM-4PM_Booked_slots', '4PM-10PM_Booked_slots',
        'label_6AM_11AM', 'label_11AM_4PM', 'label_4PM_10PM'
    ]
    missing_cols = [col for col in required_columns if col not in data.columns]
    if missing_cols:
        logging.error(f"Missing columns: {missing_cols}")
        raise ValueError(f"Missing columns: {missing_cols}")

    # Check for NaN values
    nan_counts = data[required_columns].isna().sum()
    if nan_counts.any():
        logging.warning("NaN values found in the dataset")
        logging.warning(nan_counts)
    
    # Check for invalid values
    for slot in ['6AM-11AM', '11AM-4PM', '4PM-10PM']:
        booked_col = f"{slot}_Booked_slots"
        if (data[booked_col] < 0).any():
            logging.error(f"Negative booked slots in {booked_col}")
            raise ValueError(f"Negative booked slots in {booked_col}")
        if (data[booked_col] > data['Total_Slots']).any():
            logging.warning(f"{booked_col} exceeds Total_Slots in some rows")
        if (data['Total_Slots'] == 0).any():
            logging.warning("Zero Total_Slots found, may cause issues in booking_ratio")

# Check label distribution
def check_label_distribution(data):
    logging.info("Label distribution:")
    for slot in ['6AM-11AM', '11AM-4PM', '4PM-10PM']:
        label_col = f"label_{slot}"
        if label_col in data.columns:
            distribution = data[label_col].value_counts()
            logging.info(f"{label_col}:")
            logging.info(distribution)
            logging.info(f"Percentage True: {100 * distribution.get(True, 0) / len(data):.2f}%")

# Check feature statistics
def check_feature_stats(data):
    logging.info("Feature statistics:")
    for col in ['Total_Slots', '6AM-11AM_Booked_slots', '11AM-4PM_Booked_slots', '4PM-10PM_Booked_slots']:
        if col in data.columns:
            logging.info(f"{col}:")
            logging.info(data[col].describe())

# Preprocess data for a given time slot
def preprocess_data(data, time_slot):
    if not time_slot:
        return None, None

    slot_columns = {
        '6AM-11AM': '6AM-11AM_Booked_slots',
        '11AM-4PM': '11AM-4PM_Booked_slots',
        '4PM-10PM': '4PM-10PM_Booked_slots'
    }
    label_columns = {
        '6AM-11AM': 'label_6AM_11AM',
        '11AM-4PM': 'label_11AM_4PM',
        '4PM-10PM': 'label_4PM_10PM'
    }

    X = data[['Total_Slots', slot_columns[time_slot]]].copy()
    # Handle booking_ratio to avoid division by zero
    X['booking_ratio'] = np.where(X['Total_Slots'] > 0, X[slot_columns[time_slot]] / X['Total_Slots'], 0)
    X['time_slot'] = time_slot
    y = data[label_columns[time_slot]].astype(int)  # Ensure binary labels (0/1)
    return X, y

# Train the model
def train_model():
    X_all, y_all = None, None
    for time_slot in ['6AM-11AM', '11AM-4PM', '4PM-10PM']:
        X, y = preprocess_data(data, time_slot)
        if X is None:
            continue
        if X_all is None:
            X_all = X.copy()
            y_all = y.copy()
        else:
            X_all = pd.concat([X_all, X], ignore_index=True)
            y_all = pd.concat([y_all, y], ignore_index=True)

    if X_all is None or len(X_all) < 2:
        logging.error("No valid data for training")
        raise ValueError("No valid data for training")

    logging.info(f"X_all shape before encoding: {X_all.shape}")

    # Encode time_slot
    X_all = pd.get_dummies(X_all, columns=['time_slot'], prefix='time_slot')
    feature_names = X_all.columns  # Store feature names before imputation

    logging.info(f"X_all shape after encoding: {X_all.shape}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_all, y_all, test_size=0.2, random_state=42, stratify=y_all)
    logging.info(f"X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")

    # Impute NaN values
    imputer = SimpleImputer(strategy='mean')
    X_train = imputer.fit_transform(X_train)
    X_test = imputer.transform(X_test)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Apply SMOTE to balance training data
    smote = SMOTE(random_state=42, k_neighbors=5)
    try:
        X_train_scaled, y_train = smote.fit_resample(X_train_scaled, y_train)
        logging.info(f"X_train_scaled shape after SMOTE: {X_train_scaled.shape}")
    except ValueError as e:
        logging.error(f"SMOTE failed: {e}")
        raise

    # Compute class weights
    class_counts = y_train.value_counts()
    total_samples = len(y_train)
    weight_0 = total_samples / (2 * class_counts.get(0, 1))  # Avoid division by zero
    weight_1 = total_samples / (2 * class_counts.get(1, 1))
    scale_pos_weight = weight_0 / weight_1 if weight_1 > 0 else 1
    logging.info(f"Class weights: weight_0={weight_0:.2f}, weight_1={weight_1:.2f}, scale_pos_weight={scale_pos_weight:.2f}")

    # Train XGBoost Classifier
    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)

    # Evaluate model
    y_pred = model.predict(X_test_scaled)
    logging.info("Model evaluation on test set:")
    logging.info("\n" + classification_report(y_test, y_pred))

    # Cross-validation
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='f1')
    logging.info(f"Cross-validation F1 scores: {cv_scores}")
    logging.info(f"Mean CV F1 score: {cv_scores.mean():.2f} (+/- {cv_scores.std() * 2:.2f})")

    return model, scaler, feature_names

# Save model and scaler
def save_model():
    validate_data(data)
    check_label_distribution(data)
    check_feature_stats(data)
    model, scaler, feature_names = train_model()
    os.makedirs('Models2/Models2', exist_ok=True)
    model_path = 'Models2/Models2/load_balancing_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump({'model': model, 'scaler': scaler, 'feature_names': feature_names}, f)
    logging.info(f"Model saved to {model_path}")

# Prediction class
class LoadBalancer:
    def __init__(self, model_path='Models2/Models2/load_balancing_model.pkl'):
        with open(model_path, 'rb') as f:
            saved_data = pickle.load(f)
            self.model = saved_data['model']
            self.scaler = saved_data['scaler']
            self.feature_names = saved_data['feature_names']
        logging.info(f"Loaded model with features: {self.feature_names}")

    def predict(self, total_slots, booked_slots, time_slot):
        input_data = pd.DataFrame({
            'Total_Slots': [total_slots],
            f'{time_slot}_Booked_slots': [booked_slots],
            'booking_ratio': [booked_slots / total_slots if total_slots > 0 else 0],
            'time_slot': [time_slot]
        })
        logging.info(f"Prediction input: {input_data}")
        
        input_data = pd.get_dummies(input_data, columns=['time_slot'], prefix='time_slot')
        logging.info(f"After encoding: {input_data.columns}")
        
        for col in self.feature_names:
            if col not in input_data.columns:
                input_data[col] = 0
        
        input_data = input_data[self.feature_names]
        logging.info(f"Final input features: {input_data}")
        
        input_scaled = self.scaler.transform(input_data)
        prediction = self.model.predict(input_scaled)
        logging.info(f"Prediction: {prediction[0]}")
        return bool(prediction[0])

if __name__ == '__main__':
    save_model()