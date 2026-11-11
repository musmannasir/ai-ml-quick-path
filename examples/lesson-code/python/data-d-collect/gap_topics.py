# From lesson 'd-collect' (data). Code status: Python executed 2026-11-02 (examples/gap-topics/gap_topics.py sql and viz); C# not compiled (no .NET SDK in the build environment)
q2 = """SELECT c.id, COUNT(o.id) AS n_orders, COALESCE(AVG(o.amount),0) AS avg_amount, MAX(o.ordered_on) AS last_order
        FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id"""
print(pd.read_sql(q2, con))
rows = con.execute("SELECT id FROM customers WHERE name = ?", (name,)).fetchall()   # safe parameter
