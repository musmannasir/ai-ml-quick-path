# From lesson 'd-features' (data). Code status: Python executed 2026-11-02 (ml_basics.py features); C# not compiled (no .NET SDK in the build environment)
df["tenure_days"] = (pd.Timestamp("2026-10-30") - df["signup"]).dt.days   # derived feature
ct = ColumnTransformer([("plan", OneHotEncoder(), ["plan"]),
                        ("num", StandardScaler(), ["seats", "tenure_days"])])
X = ct.fit_transform(df)
