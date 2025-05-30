import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, roc_auc_score
from imblearn.over_sampling import SMOTE
import pickle
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load data
try:
    data = pd.read_csv("balanced_dataset.csv")
    logging.info(f"Loaded dataset with shape: {data.shape}")
except FileNotFoundError:
    logging.error("balanced_dataset.csv not found")
    raise

# Preprocess dataset to set labels based on 70% booking ratio
def preprocess_labels(data):
    for slot in ['6AM-11AM', '11AM-4PM', '4PM-10PM']:
        booked_col = f"{slot}_Booked_slots"
        label_col = f"label_{slot.replace('-', '_')}"
        data[label_col] = np.where(
            (data[booked_col] / data['Total_Slots'] > 0.7) & (data['Total_Slots'] > 0),
            0,  # False if booking ratio > 0.7
            1   # True otherwise
        ).astype(int)
    return data

# Validate dataset
def validate_data(data):
    required_columns = [
        'Total_Slots', '6AM-11AM_Booked_slots', '11AM-4PM_Booked_slots', '4PM-10PM_Booked_slots'
    ]
    missing_cols = [col for col in required_columns if col not in data.columns]
    if missing_cols:
        logging.error(f"Missing columns: {missing_cols}")
        raise ValueError(f"Missing columns: {missing_cols}")

    nan_counts = data[required_columns].isna().sum()
    if nan_counts.any():
        logging.warning(f"NaN values found:\n{nan_counts}")
        data[required_columns] = data[required_columns].fillna(0)

    for slot in ['6AM-11AM', '11AM-4PM', '4PM-10PM']:
        booked_col = f"{slot}_Booked_slots"
        if (data[booked_col] < 0).any():
            logging.error(f"Negative booked slots in {booked_col}")
            raise ValueError(f"Negative booked slots in {booked_col}")
        if (data[booked_col] > data['Total_Slots']).any():
            logging.warning(f"{booked_col} exceeds Total_Slots in some rows")

# Preprocess data for training
def preprocess_data(data):
    X_all, y_all = [], []
    for slot in ['6AM-11AM', '11AM-4PM', '4PM-10PM']:
        slot_col = f"{slot}_Booked_slots"
        label_col = f"label_{slot.replace('-', '_')}"
        X = data[[slot_col, 'Total_Slots']].copy()
        X['booking_ratio'] = np.where(X['Total_Slots'] > 0, X[slot_col] / X['Total_Slots'], 0)
        X['time_slot'] = slot
        y = data[label_col].astype(int)
        X_all.append(X)
        y_all.append(y)
    
    X_all = pd.concat(X_all, ignore_index=True)
    y_all = pd.concat(y_all, ignore_index=True)
    return X_all, y_all

# Train the model
def train_model():
    # Preprocess labels based on 70% threshold
    data_processed = preprocess_labels(data)
    validate_data(data_processed)
    X, y = preprocess_data(data_processed)
    
    # Encode time_slot
    X = pd.get_dummies(X, columns=['time_slot'], prefix='time_slot')
    feature_names = X.columns.tolist()
    logging.info(f"Features: {feature_names}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    logging.info(f"X_train shape: {X_train.shape}, X_test shape: {X_test.shape}")

    # Impute (keep as DataFrame)
    imputer = SimpleImputer(strategy='mean')
    X_train = pd.DataFrame(imputer.fit_transform(X_train), columns=X_train.columns)
    X_test = pd.DataFrame(imputer.transform(X_test), columns=X_test.columns)
    
    # Scale (keep feature names)
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X_train.columns)
    X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X_test.columns)

    # Apply SMOTE
    minority_count = len(y_train[y_train == 1])
    k_neighbors = min(5, max(1, minority_count - 1)) if minority_count > 1 else 1
    smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
    try:
        X_train_scaled, y_train = smote.fit_resample(X_train_scaled, y_train)
        X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
        logging.info(f"X_train_scaled shape after SMOTE: {X_train_scaled.shape}")
    except ValueError as e:
        logging.warning(f"SMOTE failed: {e}. Proceeding without SMOTE.")
        X_train_scaled, y_train = X_train_scaled, y_train

    # Train XGBoost
    model = XGBClassifier(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.05,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    logging.info("Classification Report:\n" + classification_report(y_test, y_pred))
    roc_auc = roc_auc_score(y_test, model.predict_proba(X_test_scaled)[:, 1])
    logging.info(f"ROC-AUC Score: {roc_auc:.2f}")

    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='f1')
    logging.info(f"Cross-validation F1 scores: {cv_scores}")
    logging.info(f"Mean CV F1 score: {cv_scores.mean():.2f} (+/- {cv_scores.std() * 2:.2f})")

    return model, scaler, feature_names

# Save model
def save_model():
    model, scaler, feature_names = train_model()
    os.makedirs('Models2/Models2', exist_ok=True)
    model_path = 'Models2/Models2/load_balancing_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump({'model': model, 'scaler': scaler, 'feature_names': feature_names}, f)
    logging.info(f"Model saved to {model_path}")

if __name__ == '__main__':
    save_model()