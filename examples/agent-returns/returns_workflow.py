"""Order-return agent workflow without any framework (plain Python state machine).

Steps: request -> verify order ownership -> check return policy -> draft action
-> HUMAN APPROVAL before any refund -> execute refund (idempotent) -> audit record.
Includes failure states, retries with backoff for a flaky service and permission checks.

In a real system an LLM would extract the order id and intent from free text and
draft the customer message. Here those steps are deterministic so the control
flow is easy to test. The model never executes the refund: code does, after approval.

Runtime prerequisites: Python 3.10+ (standard library only).
Run:  python returns_workflow.py
"""
import json
import time
from dataclasses import dataclass, field
from datetime import date

TODAY = date(2026, 10, 30)
RETURN_WINDOW_DAYS = 30

ORDERS = {  # synthetic data
    "A-1001": {"customer": "c-17", "total": 59.90, "delivered": date(2026, 10, 20), "status": "delivered"},
    "A-1002": {"customer": "c-17", "total": 120.00, "delivered": date(2026, 8, 1), "status": "delivered"},
    "A-1003": {"customer": "c-42", "total": 15.00, "delivered": date(2026, 10, 25), "status": "delivered"},
}


class TransientError(Exception):
    """A temporary failure (timeout, 503) that is safe to retry."""


@dataclass
class PaymentService:
    failures_before_success: int = 0
    processed: dict = field(default_factory=dict)   # idempotency key -> refund id

    def refund(self, order_id: str, amount: float, idempotency_key: str) -> str:
        if idempotency_key in self.processed:       # repeated call: no second refund
            return self.processed[idempotency_key]
        if self.failures_before_success > 0:
            self.failures_before_success -= 1
            raise TransientError("payment service timeout")
        refund_id = f"R-{len(self.processed) + 1:04d}"
        self.processed[idempotency_key] = refund_id
        return refund_id


def with_retries(fn, attempts: int = 3, base_delay: float = 0.01):
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except TransientError:
            if attempt == attempts:
                raise
            time.sleep(base_delay * 2 ** (attempt - 1))   # exponential backoff


def run_return(customer_id: str, order_id: str, approver, payments: PaymentService, audit: list) -> str:
    def log(event: str, **data):
        audit.append({"order": order_id, "customer": customer_id, "event": event, **data})

    log("request_received")
    order = ORDERS.get(order_id)
    if order is None:
        log("rejected", reason="order_not_found")
        return "rejected: order not found"
    if order["customer"] != customer_id:                    # permission check
        log("rejected", reason="not_order_owner")
        return "rejected: you can only return your own orders"
    age = (TODAY - order["delivered"]).days
    if age > RETURN_WINDOW_DAYS:                             # policy check
        log("rejected", reason="outside_return_window", days=age)
        return f"rejected: delivered {age} days ago (limit {RETURN_WINDOW_DAYS})"
    draft = {"action": "refund", "amount": order["total"]}
    log("draft_created", **draft)
    decision = approver(order_id, draft)                     # human-in-the-loop gate
    log("approval_decision", approved=decision)
    if not decision:
        return "pending: refund declined by reviewer; customer will be contacted"
    try:
        refund_id = with_retries(lambda: payments.refund(order_id, draft["amount"], f"refund:{order_id}"))
    except TransientError:
        log("failed", reason="payment_service_unavailable")
        return "failed: payment service unavailable; queued for manual follow-up"
    log("refund_executed", refund_id=refund_id)
    return f"refunded {draft['amount']:.2f} as {refund_id}"


def main() -> None:
    audit: list = []
    approve, decline = (lambda *_: True), (lambda *_: False)
    scenarios = [
        ("happy path", "c-17", "A-1001", approve, PaymentService()),
        ("reviewer declines", "c-17", "A-1001", decline, PaymentService()),
        ("not the owner", "c-17", "A-1003", approve, PaymentService()),
        ("outside window", "c-17", "A-1002", approve, PaymentService()),
        ("flaky service recovers", "c-17", "A-1001", approve, PaymentService(failures_before_success=2)),
        ("service down", "c-17", "A-1001", approve, PaymentService(failures_before_success=5)),
    ]
    for name, cust, order, approver, svc in scenarios:
        print(f"{name:<24} -> {run_return(cust, order, approver, svc, audit)}")
    svc = PaymentService()
    first = run_return("c-17", "A-1001", approve, svc, audit)
    second = run_return("c-17", "A-1001", approve, svc, audit)
    print(f"{'duplicate request':<24} -> {first} / {second}; refunds issued: {len(svc.processed)}")
    print(f"Audit events recorded: {len(audit)}; last: {json.dumps(audit[-1])}")


if __name__ == "__main__":
    main()
