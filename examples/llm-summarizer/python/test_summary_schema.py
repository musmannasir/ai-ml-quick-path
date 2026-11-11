"""Run: python -m unittest test_summary_schema.py"""
import unittest

from summary_schema import SummaryValidationError, parse_summary


class SummarySchemaTests(unittest.TestCase):
    def test_valid(self):
        s = parse_summary('{"summary": "Damaged item.", "priority": "high", "next_action": "Send replacement."}')
        self.assertEqual(s.priority, "high")

    def test_rejects_unknown_priority(self):
        with self.assertRaises(SummaryValidationError):
            parse_summary('{"summary": "x", "priority": "urgent!!", "next_action": "y"}')

    def test_rejects_missing_field(self):
        with self.assertRaises(SummaryValidationError):
            parse_summary('{"summary": "x", "priority": "low"}')

    def test_rejects_prose(self):
        with self.assertRaises(SummaryValidationError):
            parse_summary("Sure! Here is the summary: ...")


if __name__ == "__main__":
    unittest.main()
