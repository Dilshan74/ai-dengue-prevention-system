import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

print("Loading dataset...")
# CSV eka load karagannawa
data = pd.read_csv('dengue_data.csv')

# Inputs (Features) saha Output (Label) wen karagannawa
X = data[['Temperature', 'Humidity', 'Rainfall', 'Previous_Cases']]
y = data['Risk_Label']

print("Training Random Forest Model...")
# Model eka train karanawa
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X, y)

# Train karapu model eka save karanawa
joblib.dump(rf_model, 'dengue_rf_model.pkl')
print("Model trained and saved as 'dengue_rf_model.pkl' successfully!")
