"""Validation for the support-email summary contract (standard library only).

A model's JSON is untrusted input: parse it, check types and allowed values,
and reject anything else before it reaches a database or a person's queue.
"""
import json
from dataclasses import dataclass

ALLOWED_PRIORITIES = {"low", "medium", "high"}


class SummaryValidationError(ValueError):
    pass


@dataclass(frozen=True)
class EmailSummary:
    summary: str
    priority: str
    next_action: str


def parse_summary(raw: str) -> EmailSummary:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SummaryValidationError(f"not valid JSON: {exc.msg}") from exc
    if not isinstance(data, dict):
        raise SummaryValidationError("expected a JSON object")
    missing = {"summary", "priority", "next_action"} - data.keys()
    if missing:
        raise SummaryValidationError(f"missing fields: {sorted(missing)}")
    if data["priority"] not in ALLOWED_PRIORITIES:
        raise SummaryValidationError(f"priority must be one of {sorted(ALLOWED_PRIORITIES)}")
    for key in ("summary", "next_action"):
        if not isinstance(data[key], str) or not data[key].strip():
            raise SummaryValidationError(f"{key} must be a non-empty string")
        if len(data[key]) > 300:
            raise SummaryValidationError(f"{key} is longer than 300 characters")
    return EmailSummary(data["summary"].strip(), data["priority"], data["next_action"].strip())
