"""Supervised learning baseline: classify short messages as spam or not spam.

Runtime prerequisites: Python 3.10+, scikit-learn 1.3+ (tested with 1.8.0).
Run:  python spam_classifier.py
All data is synthetic and written for this academy.
"""
from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

# 1 = spam, 0 = not spam. A person assigned these labels: that is what makes
# the task *supervised* learning.
MESSAGES = [
    ("WIN a free phone now, click this link", 1),
    ("Your account is locked, send your password to unlock", 1),
    ("Claim your cash prize today, limited offer", 1),
    ("Cheap loans approved instantly, no credit check", 1),
    ("You have been selected for a free holiday, reply YES", 1),
    ("Urgent: verify your bank details to avoid suspension", 1),
    ("Congratulations, you won a gift card, click to claim", 1),
    ("Earn money from home, free sign up bonus", 1),
    ("Exclusive deal: free trial, cancel anytime, click now", 1),
    ("Final notice: your prize expires tonight", 1),
    ("Are we still meeting for lunch tomorrow?", 0),
    ("Please review the attached sprint notes before standup", 0),
    ("Can you send me the report by Friday?", 0),
    ("Thanks for your help with the deployment yesterday", 0),
    ("The build failed on the main branch, can you take a look", 0),
    ("Reminder: team meeting moved to 3 pm", 0),
    ("Happy birthday! Hope you have a great day", 0),
    ("I pushed the fix, tests are passing now", 0),
    ("Could we reschedule the design review to Monday?", 0),
    ("Dinner at my place on Saturday?", 0),
    ("The invoice for October is in the shared folder", 0),
    ("Let me know when the client call is confirmed", 0),
    ("Your parcel was delivered to the front desk", 0),
    ("Lunch menu for the offsite is attached", 0),
]


def main() -> None:
    texts = [m for m, _ in MESSAGES]
    labels = [y for _, y in MESSAGES]

    # Split FIRST, then fit any preprocessing on the training part only.
    # stratify keeps the spam/not-spam ratio similar in both parts;
    # random_state makes the split repeatable.
    x_train, x_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.33, stratify=labels, random_state=42
    )

    # Baseline: always predict the most frequent class. A real model must beat it.
    baseline = DummyClassifier(strategy="most_frequent").fit(x_train, y_train)
    base_pred = baseline.predict(x_test)

    # The Pipeline learns the TF-IDF vocabulary from training text only.
    # Fitting the vectorizer on ALL texts before splitting would leak
    # information about the test set into training (data leakage).
    model = make_pipeline(TfidfVectorizer(lowercase=True), LogisticRegression(max_iter=1000))
    model.fit(x_train, y_train)
    pred = model.predict(x_test)

    print(f"Training examples: {len(x_train)}, test examples: {len(x_test)}")
    print(
        f"Baseline  precision={precision_score(y_test, base_pred, zero_division=0):.2f} "
        f"recall={recall_score(y_test, base_pred, zero_division=0):.2f}"
    )
    print(
        f"Model     precision={precision_score(y_test, pred, zero_division=0):.2f} "
        f"recall={recall_score(y_test, pred, zero_division=0):.2f}"
    )
    tn, fp, fn, tp = confusion_matrix(y_test, pred, labels=[0, 1]).ravel()
    print(f"Confusion matrix: TP={tp} FP={fp} FN={fn} TN={tn}")

    new_message = "Click now to claim your free prize"
    proba = model.predict_proba([new_message])[0][1]
    label = "spam" if proba >= 0.5 else "not spam"
    print(f"New message: {new_message!r} -> {label} (spam probability {proba:.2f})")


if __name__ == "__main__":
    main()
