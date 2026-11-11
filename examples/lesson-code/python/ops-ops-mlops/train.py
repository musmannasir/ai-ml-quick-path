# From lesson 'ops-mlops' (ops). Code status: Python executed 2026-11-02 (quickpath.py registry); MLflow and C# not run (MLflow not installed and no .NET SDK in the build environment)
import mlflow, mlflow.sklearn
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score

mlflow.set_experiment("churn")
with mlflow.start_run():
    params = {"n_estimators": 200, "max_depth": 3}
    model = GradientBoostingClassifier(**params).fit(X_train, y_train)
    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    mlflow.log_params(params)
    mlflow.log_param("data_sha256", data_hash)
    mlflow.log_metric("test_auc", auc)
    mlflow.sklearn.log_model(model, "model", registered_model_name="churn")
