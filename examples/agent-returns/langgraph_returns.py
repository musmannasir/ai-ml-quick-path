"""The same return workflow as a LangGraph graph with a human-approval interrupt.

Runtime prerequisites: Python 3.10+, `pip install -U langgraph` (tested API:
StateGraph, interrupt, Command, InMemorySaver as documented at
https://docs.langchain.com/oss/python/langgraph/interrupts, checked 2026-10-30).
Status here: syntax-checked only (LangGraph is not installed in the academy build
environment). Use a durable checkpointer (for example Postgres) in production,
because InMemorySaver loses pending approvals when the process restarts.
"""
from typing import Literal, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt

ORDERS = {"A-1001": {"customer": "c-17", "total": 59.90, "age_days": 10}}


class ReturnState(TypedDict, total=False):
    customer_id: str
    order_id: str
    amount: float
    outcome: str
    audit: list


def verify(state: ReturnState) -> Command[Literal["draft", "__end__"]]:
    order = ORDERS.get(state["order_id"])
    if not order or order["customer"] != state["customer_id"] or order["age_days"] > 30:
        return Command(goto=END, update={"outcome": "rejected", "audit": ["rejected"]})
    return Command(goto="draft", update={"amount": order["total"], "audit": ["verified"]})


def draft(state: ReturnState) -> dict:
    return {"audit": state["audit"] + [f"draft refund {state['amount']}"]}


def approval(state: ReturnState) -> Command[Literal["refund", "__end__"]]:
    # Execution pauses here; the payload is shown to a reviewer. The value passed
    # with Command(resume=...) becomes the return value of interrupt().
    approved = interrupt({"question": "Approve refund?", "order": state["order_id"], "amount": state["amount"]})
    if approved is True:
        return Command(goto="refund", update={"audit": state["audit"] + ["approved"]})
    return Command(goto=END, update={"outcome": "declined", "audit": state["audit"] + ["declined"]})


def refund(state: ReturnState) -> dict:
    # Call the payment service with an idempotency key here (see returns_workflow.py).
    return {"outcome": f"refunded {state['amount']}", "audit": state["audit"] + ["refund_executed"]}


builder = StateGraph(ReturnState)
builder.add_node("verify", verify)
builder.add_node("draft", draft)
builder.add_node("approval", approval)
builder.add_node("refund", refund)
builder.add_edge(START, "verify")
builder.add_edge("draft", "approval")
builder.add_edge("refund", END)
graph = builder.compile(checkpointer=InMemorySaver())

if __name__ == "__main__":
    config = {"configurable": {"thread_id": "return-A-1001"}}
    first = graph.invoke({"customer_id": "c-17", "order_id": "A-1001"}, config)
    print("Paused:", first.get("__interrupt__"))
    final = graph.invoke(Command(resume=True), config)   # reviewer approves
    print("Outcome:", final["outcome"], final["audit"])
