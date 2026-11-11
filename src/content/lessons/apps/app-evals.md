---
id: app-evals
title: Evaluating AI applications
module: apps
level: Intermediate
minutes: 75
goal: Build an evaluation set, write automatic checks, use an LLM as a judge carefully, detect hallucinations, and compare versions with A/B tests.
prereqs: app-rag
reviewed: 2026-11-02
evidence: An evaluation script with thresholds that runs on every change, plus one regression it caught.
code: Python executed 2026-11-02 (applied_basics.py evals, examples/math/math_for_ai.py abtest); C# not compiled (no .NET SDK in the build environment)
---
## In plain words
AI output varies, and changing a prompt, model or document can quietly break things. An **evaluation (eval)** is a repeatable test on fixed inputs. An **evaluation set** holds realistic inputs with expected outcomes: the right category, facts that must appear, the source to cite, or "should refuse". **Automatic checks** come first: valid JSON, allowed values, correct citation, forbidden text absent. For qualities such as helpfulness or tone, a person or an **LLM-as-judge** (a model scoring answers against a rubric) can score; check the judge against human scores before trusting it. **Hallucination** checks test that every claim is supported by the sources. In production, an **A/B test** shows two versions to different users and compares results, with a statistical test so you do not mistake noise for improvement. Run evals in CI and block releases that fall below thresholds.

```diagram flow An eval, step by step
note: An eval is a repeatable test on fixed inputs.
- Evaluation set | realistic inputs with expected outcomes | input
- Run the application | same inputs every time | process
- Score the outputs | automatic checks, then judge or person | process
- Compare with thresholds | block the release if below | output
```

```diagram layers What an evaluation set can expect
note: Each case states one kind of expected outcome.
- The right category | for example the correct ticket priority | input
- Facts that must appear | in the answer | input
- The source to cite | the answer names a known source | input
- Should refuse | the correct outcome is to decline | input
```

```diagram compare Three ways to score an output
## Automatic checks | process
- Valid JSON, allowed values
- Correct citation
- Forbidden text absent
- Cheap, fast, repeatable
## LLM-as-judge | model
- A model scores against a rubric
- For helpfulness or tone
- Check it against human scores first
## Person | input
- Scores qualities directly
- Used to check the judge
```

```diagram flow Hallucination check
note: A hallucination check tests that every claim is supported by the sources.
- Answer | the model's claims | output
- Compare with sources | is each claim backed? | process
- Supported or not | unsupported claims are flagged | warn
```

## Real-world example
A team switched to a cheaper model. The eval showed JSON validity unchanged but priority accuracy on urgent tickets down from 88% to 74%. They kept the old model for that step and used the cheaper one elsewhere: a saving without a quality drop.

```diagram compare What the eval showed for the cheaper model
note: Numbers are from the example in the text.
## JSON validity | output
- Unchanged with the cheaper model
## Priority accuracy on urgent tickets | bad
- Down from 88% to 74%
## Decision | process
- Keep the old model for that step
- Use the cheaper one elsewhere
```

## How it works
1. Collect 50–200 realistic cases, including edge cases and past failures.
2. Write expected outcomes and automatic checks.
3. Add an LLM judge only where needed; compare it with human labels on a sample.
4. Record a baseline; set thresholds; run on every change.
5. Read failures, not only scores; add new failures to the set.
6. In production, A/B test important changes with enough users.

```diagram loop The eval cycle
note: Read failures, not only scores.
- Collect 50-200 cases | include edge cases and past failures | input
- Write expected outcomes | and automatic checks | process
- Add a judge only where needed | compare with human labels | model
- Baseline and thresholds | run on every change | process
- Read the failures | not only the scores | output
loop: Add new failures to the set and run again
```

```diagram lanes Offline eval and online A/B test
## Before release (eval)
- Fixed evaluation set | input
- Checks and thresholds | process
- Release or block | output
## In production (A/B test)
- Version A and version B shown to different users | input
- Compare results with a statistical test | process
- Keep the better version | output
```

### Related concepts

#### Eval datasets
An **eval dataset** is a saved set of questions, each with an expected answer or a rule the answer must follow. Build it from real cases: past tickets, real user questions and failures you have seen. Include hard cases and **forbidden cases**, where the right outcome is to refuse or to leave something out. Keep a version number, so you know which dataset produced which score. Split it in two: a part you may study and tune on, and a **test part** you never tune on. If you tune on the test part, the score no longer tells you how the system will do on new questions.

```diagram merge Building an eval dataset
note: Version it, and keep a test part you never tune on.
- Versioned eval dataset | a tuning part and a test part | store
- Real cases | tickets, user questions, past failures | input
- Hard cases | unusual, vague or tricky requests | warn
- Forbidden cases | the right outcome is to refuse | bad
```

#### LLM as judge
An **LLM as judge** is a second model that scores answers against a written rubric, such as "is every claim supported by the sources?". It is useful for qualities that simple checks cannot see. It needs checks of its own. First, compare its scores with human scores on a sample and confirm they agree. Second, watch for bias, such as favouring longer answers or answers that sound confident. Third, use a different model from the one being judged when possible, because a model may rate its own style too kindly.

```diagram loop Checking an LLM judge
loop: Re-check the judge when the rubric or the judge model changes
- Write a rubric | clear scoring rules | input
- Judge scores a sample | a different model when possible | model
- People score the same sample | the reference | input
- Compare the scores | do judge and people agree? | process
- Look for bias | for example favouring long answers | warn
```

#### Regression tests
A **regression** is a quality drop caused by a change. A **regression test** re-runs the eval set whenever a prompt, model, retrieval setting or piece of code changes. Agree a quality bar first, for example a minimum score for each check. If the new result falls below the bar, the release fails. Every failure found in production becomes a new test case, so the same mistake cannot return unnoticed.

```diagram flow Regression gate before release
- A change | prompt, model, retrieval setting or code | input
- Re-run the eval set | same cases, same checks | process
- Below the agreed bar? | compare with the thresholds | warn
- Release or fail | fail the release if quality dropped | output
```

#### Prompt A/B tests
A **prompt A/B test** sends a share of real traffic to a new prompt version (B) while the rest keeps the current one (A). Compare measures agreed in advance, such as task success, user feedback and cost. Split users fairly at random, and collect enough of them before you decide; a small sample can mislead. Guard against harm: start with a small share, and stop B quickly if it does worse on safety or errors.

```diagram fan Splitting traffic in a prompt A/B test
note: Start with a small share for B, then grow it if B holds up.
- Incoming requests | real traffic, split at random | input
- Prompt A | the current version, most of the traffic | model
- Prompt B | the new version, a small share at first | model
- Compare agreed measures | success, feedback, cost, errors | output
```

## Python example
```text Output of applied_basics.py evals (executed)
t1: json=ok priority=ok fact=ok
t2: json=ok priority=ok fact=ok
t3: json=FAIL priority=FAIL fact=FAIL
t4: json=ok priority=FAIL fact=ok
json valid 3/4, priority correct 2/4, all checks pass 2/4
```
An A/B test of two versions with 2,000 users each (10.0% versus 12.0% success):
```text Output of math_for_ai.py abtest (executed)
A 0.100 vs B 0.120: z=2.02, two-sided p=0.043
```
If the versions were truly equal, a gap this big would appear about 4% of the time by chance, so B is very likely better, though only just past the usual 5% line.
```yaml CI thresholds (example)
json_valid: 1.00
priority_accuracy: 0.85
forbidden_disclosure: 0      # cases where restricted text appeared
```

## .NET (C#) example
An LLM-as-judge with a typed verdict, plus a deterministic citation check:
```cs Judge.cs
using System.Text.RegularExpressions;
using Microsoft.Extensions.AI;

public record Verdict(bool Supported, int Helpfulness, string Reason);   // Helpfulness 1-5

public static class Evals
{
    public static bool CitesKnownSource(string answer, ISet<string> sourceIds) =>
        Regex.Matches(answer, @"\[([\w#-]+)\]").Select(m => m.Groups[1].Value).Any(sourceIds.Contains);

    public static async Task<Verdict?> JudgeAsync(IChatClient judge, string question, string sources, string answer)
    {
        var response = await judge.GetResponseAsync<Verdict>(
        [
            new(ChatRole.System, "You grade answers. Supported = every claim is backed by the sources. Helpfulness 1-5. Be strict."),
            new(ChatRole.User, $"Question: {question}\nSources:\n{sources}\nAnswer: {answer}"),
        ], new ChatOptions { Temperature = 0 });
        return response.TryGetResult(out var v) ? v : null;
    }
}
```
Microsoft also publishes `Microsoft.Extensions.AI.Evaluation` libraries with ready-made quality evaluators for .NET.

## Applied Maths - Statistics
Short, optional reading. Open a topic to see the formula, what it means and two worked examples. The numbers are small, made-up values chosen so you can check them by hand.

### Accuracy with a confidence interval (how sure is the score)
**Where it is used:** reporting a pass rate from a test set of questions without over-claiming.

```formula Accuracy and 95% interval
p = correct ÷ total
standard error = sqrt( p × (1 - p) ÷ n )
interval ≈ p ± 1.96 × standard error
```
n is the number of test cases. 1.96 gives roughly 95% confidence.

**In plain words:** a score on a few cases is shaky. The interval shows the range the true pass rate could plausibly sit in. More test cases make it narrower.

**Example 1: 50 test cases.** 40 pass, so p = 40 ÷ 50 = 0.80. Standard error = sqrt(0.8 × 0.2 ÷ 50) = sqrt(0.0032) = 0.0566. Margin = 1.96 × 0.0566 = 0.111. Interval is about 0.69 to 0.91.

**Example 2: 200 test cases.** 160 pass, p = 0.80 again. Standard error = sqrt(0.16 ÷ 200) = sqrt(0.0008) = 0.0283. Margin = 1.96 × 0.0283 = 0.055. Interval is about 0.745 to 0.855, much tighter.

### Precision and recall (two kinds of mistake)
**Where it is used:** scoring a checker, such as a judge that flags unsafe or wrong answers.

```formula Precision and recall
precision = TP ÷ (TP + FP)
recall    = TP ÷ (TP + FN)
```
TP = true positives (flagged and really bad). FP = false positives (flagged but fine). FN = false negatives (bad but missed).

**In plain words:** precision asks "when it flags, is it right?". Recall asks "of all the real problems, how many did it catch?".

**Example 1: a balanced checker.** TP = 8, FP = 2, FN = 4. Precision = 8 ÷ 10 = 0.80. Recall = 8 ÷ 12 = 0.67.

**Example 2: flag everything.** 100 answers, 12 really bad. The checker flags all 100: TP = 12, FP = 88, FN = 0. Recall = 12 ÷ 12 = 1.00, but precision = 12 ÷ 100 = 0.12. A perfect recall alone can hide a useless checker.

## Maths behind it
- Accuracy and agreement rates (statistics)
- Hypothesis tests and p-values (A/B testing)
- Confidence intervals and sample size
- Inter-rater agreement (judge versus humans)

## Common mistakes
- Judging a change by a few hand-picked examples.
- Trusting an LLM judge that was never compared with human scores.
- Stopping an A/B test the moment it looks good, which inflates false wins.
- Tuning the prompt on the test part of the eval set, so the score looks better than real life.
- Letting an LLM judge prefer long answers, or judging a model with itself.
- Skipping the regression run for a "small" prompt change, and not adding production failures as new tests.

```diagram compare Judging a change
## Weak habits | bad
- A few hand-picked examples
- An LLM judge never compared with humans
- Stopping an A/B test as soon as it looks good
## Sound habits | output
- A realistic evaluation set
- Judge checked against human scores
- Enough users, then a statistical test
```

## Quick check
Q: Why prefer automatic deterministic checks where possible?
A: They are cheap, fast, repeatable and unambiguous; judge models add cost and their own errors.

Q: What does p = 0.043 mean in an A/B test?
A: If there were no real difference, a gap this large would appear about 4.3% of the time by chance.

Q: How do you make an LLM judge trustworthy?
A: Measure its agreement with human scores on a sample before relying on it, and re-check it over time.

Q: Why keep a test part of the eval set that you never tune on?
A: If you tune on it, the score stops showing how the system will do on new questions.

Q: What should happen to a failure found in production?
A: It becomes a new test case, and the regression run fails any release that repeats it.
