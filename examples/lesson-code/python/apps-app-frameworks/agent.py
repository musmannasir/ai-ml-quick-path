# From lesson 'app-frameworks' (apps). Code status: Conceptual (framework packages not installed in the build environment); C# not compiled (no .NET SDK)
import os
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain_core.tools import tool

@tool
def get_order_status(order_id: str) -> str:
    """Return the delivery status for one of the current customer's orders."""
    return ORDERS.status_for(CURRENT_CUSTOMER, order_id)

agent = create_agent(init_chat_model(os.environ["LC_MODEL"], temperature=0), tools=[get_order_status],
                     system_prompt="Answer order questions using tools. Never invent order data.")
print(agent.invoke({"messages": [{"role": "user", "content": "Where is order A-1001?"}]})["messages"][-1].content)
