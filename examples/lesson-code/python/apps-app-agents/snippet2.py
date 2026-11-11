# From lesson 'app-agents' (apps). Code status: Python framework-free workflow executed 2026-11-02 (examples/agent-returns/returns_workflow.py); LangGraph and C# (Microsoft Agent Framework) not run (not installed in the build environment)
# FRAGMENT: part of a larger program; see the lesson for the surrounding code. Not runnable on its own.
# decision = approver(order_id, draft)                     # human in the loop
# if not decision:
#     return "pending: refund declined by reviewer; customer will be contacted"
# refund_id = with_retries(lambda: payments.refund(order_id, draft["amount"], f"refund:{order_id}"))  # idempotency key
