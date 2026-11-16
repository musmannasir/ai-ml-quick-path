# From lesson 'app-genai-agentic' (apps). Code status: Python agent loop is a teaching sketch (see the status above for what was checked)
# A tiny agent loop with a fake "model". No packages needed.

ORDERS = {"A-1001": {"status": "lost", "total": 25.00}}

def find_order(order_id):
    return ORDERS.get(order_id, {"status": "not found"})

def prepare_refund(order_id):
    # Risky tool: it only PREPARES a refund. A person must approve it.
    return {"refund_prepared_for": order_id, "needs_approval": True}

TOOLS = {"find_order": find_order, "prepare_refund": prepare_refund}

def decide(goal, history):
    """Stand-in for the model. A real model reads the goal and history and picks the next step."""
    if not history:
        return {"tool": "find_order", "input": "A-1001"}
    last = history[-1]["result"]
    if last.get("status") == "lost" and len(history) == 1:
        return {"tool": "prepare_refund", "input": "A-1001"}
    return {"answer": "Order A-1001 was lost. A refund is ready for approval."}

def run_agent(goal, max_steps=5):            # a step limit stops endless loops
    history = []
    for step in range(1, max_steps + 1):
        action = decide(goal, history)
        if "answer" in action:
            return action["answer"], history
        result = TOOLS[action["tool"]](action["input"])
        history.append({"step": step, "tool": action["tool"], "result": result})
        print(f"step {step}: {action['tool']}({action['input']}) -> {result}")
        if result.get("needs_approval"):     # human in the loop
            ok = input("Approve this refund? (y/n) ").strip().lower() == "y"
            if not ok:
                return "Stopped: a person did not approve the refund.", history
    return "Stopped: step limit reached.", history

answer, steps = run_agent("Customer says order A-1001 never arrived and wants a refund")
print(answer)
