from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelBinarizer

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "data" / "prepared" / "triage_dataset.csv"
ARTIFACTS = ROOT / "backend" / "model-artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
MODEL_VERSION = "vital-triage-vitals-gb-0.4"
NUMERIC_FEATURES = [
    "age",
    "pulse",
    "spo2",
    "temperature",
    "systolic_bp",
    "respiration",
    "medication_score",
    "voice_distress",
]


def ensure_dataset() -> None:
    if DATASET.exists():
        return
    subprocess.check_call([sys.executable, str(ROOT / "scripts" / "prepare_triage_dataset.py")])


def main() -> None:
    ensure_dataset()
    frame = pd.read_csv(DATASET)
    labels = frame["state"].astype(str)
    features = frame.drop(columns=["state"])
    missing = sorted(set(NUMERIC_FEATURES) - set(features.columns))
    if missing:
        raise ValueError(f"Triage dataset is missing required numeric features: {', '.join(missing)}")

    train_x, test_x, train_y, test_y = train_test_split(
        features,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels,
    )

    # The current benchmark's symptom text is generated case context, not a
    # patient-reported narrative. Exclude it to prevent ID/context noise from
    # being mistaken for clinical signal. Trees also capture nonlinear vital
    # interactions that the previous linear classifier could not represent.
    preprocess = ColumnTransformer(
        transformers=[
            ("numeric", SimpleImputer(strategy="median"), NUMERIC_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    estimator = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.05,
        max_depth=2,
        random_state=42,
    )
    model = Pipeline([("features", preprocess), ("classifier", estimator)])

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = cross_validate(
        model,
        train_x,
        train_y,
        cv=cv,
        scoring={
            "accuracy": "accuracy",
            "macroF1": "f1_macro",
            "balancedAccuracy": "balanced_accuracy",
        },
        n_jobs=1,
        return_train_score=False,
    )

    model.fit(train_x, train_y)
    predicted = model.predict(test_x)
    probabilities = model.predict_proba(test_x)
    classes = list(model.classes_)
    cm = confusion_matrix(test_y, predicted, labels=classes)
    report = classification_report(test_y, predicted, labels=classes, output_dict=True, zero_division=0)
    lb = LabelBinarizer()
    y_bin = lb.fit_transform(test_y)
    try:
        auroc = float(roc_auc_score(y_bin, probabilities, multi_class="ovr", average="macro"))
    except ValueError:
        auroc = None
    brier_values = []
    for class_index, label in enumerate(classes):
        truth = (test_y == label).astype(int)
        brier_values.append(brier_score_loss(truth, probabilities[:, class_index]))
    emergency_recall = recall_score(test_y, predicted, labels=["Emergency"], average="macro", zero_division=0)
    emergency_index = classes.index("Emergency") if "Emergency" in classes else None
    emergency_support = int((test_y == "Emergency").sum())
    # The diagonal entry is the number of correctly identified Emergency rows.
    emergency_detected = int(cm[emergency_index, emergency_index]) if emergency_index is not None else 0

    metrics = {
        "modelVersion": MODEL_VERSION,
        "engine": "scikit-learn GradientBoostingClassifier over numeric vital/profile features",
        "generatedAt": pd.Timestamp.now(tz="UTC").isoformat(),
        "classes": classes,
        "rows": int(len(frame)),
        "featurePolicy": "Numeric vital/profile features only; generated case-context text excluded.",
        "split": {
            "train": int(len(train_x)),
            "test": int(len(test_x)),
            "strategy": "stratified random split, random_state=42",
            "evaluationModelFitRows": int(len(train_x)),
            "productionModelFitRows": int(len(frame)),
            "testPartitionIncludedInProductionFit": True,
        },
        "crossValidation": {
            "strategy": "5-fold stratified CV on the training partition only",
            "accuracyMean": round(float(cv_results["test_accuracy"].mean()), 3),
            "accuracyStd": round(float(cv_results["test_accuracy"].std()), 3),
            "macroF1Mean": round(float(cv_results["test_macroF1"].mean()), 3),
            "macroF1Std": round(float(cv_results["test_macroF1"].std()), 3),
            "balancedAccuracyMean": round(float(cv_results["test_balancedAccuracy"].mean()), 3),
            "balancedAccuracyStd": round(float(cv_results["test_balancedAccuracy"].std()), 3),
        },
        "accuracy": round(float(accuracy_score(test_y, predicted)), 3),
        "balancedAccuracy": round(float(balanced_accuracy_score(test_y, predicted)), 3),
        "macroF1": round(float(f1_score(test_y, predicted, average="macro")), 3),
        "weightedF1": round(float(f1_score(test_y, predicted, average="weighted")), 3),
        "emergencyRecall": round(float(emergency_recall), 3),
        "emergencyDetected": emergency_detected,
        "emergencySupport": emergency_support,
        "emergencyFalseNegativeCount": emergency_support - emergency_detected,
        "emergencyFalseNegativeRate": round(float(1 - emergency_recall), 3),
        "aurocOvR": round(auroc, 3) if auroc is not None else None,
        "brierScore": round(float(np.mean(brier_values)), 3),
        "confusionMatrix": {"labels": classes, "values": cm.tolist()},
        "classificationReport": report,
        "limitations": [
            "The three VITAL labels are deterministic acuity proxies derived from final PhysioNet vital signs and sepsis labels; they are not original clinician-adjudicated emergency triage outcomes.",
            "The dataset has no verified patient symptom narratives; generated case-context text is excluded from model training.",
            "The raw PhysioNet PSV files are not present in this workspace; the current prepared export's original patient sampling history is not recorded.",
            "Improved held-out benchmark metrics do not establish clinical accuracy or readiness. Emergency recall remains insufficient for clinical use.",
            "Use a credentialed emergency-department dataset with clinically adjudicated outcomes and prospective review before considering triage-model use.",
        ],
    }

    # Preserve the untouched holdout metrics above, then refit the selected
    # model on every available row for the local application artifact.
    production_model = clone(model).fit(features, labels)
    joblib.dump(
        {
            "model": production_model,
            "modelVersion": MODEL_VERSION,
            "engine": metrics["engine"],
            "featureColumns": NUMERIC_FEATURES,
            "classes": classes,
        },
        ARTIFACTS / "triage_model.joblib",
    )
    (ARTIFACTS / "triage_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
