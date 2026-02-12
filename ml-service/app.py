from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from sklearn.linear_model import LogisticRegression

app = FastAPI()


X_train = np.array([
    [500, 1, 1.0, 365, 0],
    [15000, 5, 4.5, 30, 1],
    [2000, 2, 1.5, 200, 0],
    [25000, 8, 6.0, 10, 2],
    [800, 1, 1.2, 400, 0],
])

y_train = np.array([0, 1, 0, 1, 0])

model = LogisticRegression()
model.fit(X_train, y_train)



class TransactionFeatures(BaseModel):
    amount: float
    velocity: int
    amount_vs_avg: float
    account_age: int
    fraud_history: int



@app.post("/predict")
def predict(data: TransactionFeatures):
    features = np.array([[
        data.amount,
        data.velocity,
        data.amount_vs_avg,
        data.account_age,
        data.fraud_history
    ]])

    prob = model.predict_proba(features)[0][1]

    return {
        "fraud_probability": float(prob)
    }
