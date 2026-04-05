import numpy as np
import pandas as pd
import joblib
import os
import requests
from sklearn.base import BaseEstimator, TransformerMixin


class DiseaseFeatureEngineer(BaseEstimator, TransformerMixin):
    def __init__(self, random_state: int = 42):
        self.random_state = random_state

    def fit(self, X, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = X.copy()
        X = X.sort_values(["Disease", "County", "Year"])

        X["lag_cases"] = X.groupby(["Disease", "County"])["Count"].shift(1)
        X["lag_rate"]  = X.groupby(["Disease", "County"])["Rate"].shift(1)
        X["growth"]    = (X["Count"] - X["lag_cases"]) / (X["lag_cases"] + 1)

        rng = np.random.RandomState(self.random_state)
        X["temperature"]  = rng.normal(20, 5,   len(X))
        X["humidity"]     = rng.normal(60, 10,  len(X))
        X["travel_index"] = rng.uniform(0, 100, len(X))

        return X


class DiseaseModel:
    def __init__(self, model_path: str = "disease_pipeline.pkl"):
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(BASE_DIR, model_path)

        # إذا المودل مو موجود → حمله من Google Drive
        if not os.path.exists(model_path):
            print("⬇️ Downloading model from Google Drive...")

            url = "https://drive.google.com/uc?id=1EgrTjsPXsprCX8DvGHNOc_PLYAev-Edc"
            response = requests.get(url)

            if response.status_code == 200:
                with open(model_path, "wb") as f:
                    f.write(response.content)
                print("✅ Model downloaded successfully")
            else:
                raise Exception("❌ Failed to download model")

        print("🚀 Loading model...")
        self.pipeline = joblib.load(model_path)

    def predict_pair(
        self,
        *,
        disease:    str,
        county:     str,
        sex:        str = "Total",
        year_prev:  int,
        count_prev: float,
        rate_prev:  float,
        year_curr:  int,
        count_curr: float,
        rate_curr:  float,
    ) -> dict:

        df = pd.DataFrame(
            {
                "Disease": [disease,    disease],
                "County":  [county,     county],
                "Year":    [year_prev,  year_curr],
                "Count":   [count_prev, count_curr],
                "Rate":    [rate_prev,  rate_curr],
            }
        )

        outputs = self.pipeline.predict(df)

        return {
            "output_0":  float(outputs[0]),
            "output_1":  float(outputs[1]),
            "predicted": float(outputs[1]),
        }