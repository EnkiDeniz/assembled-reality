# Evaluation Protocol v0.1

## Reproducibility

Agreement across repeated runs on:

1. result type,
2. top shape,
3. gate outcome,
4. granularity,
5. invariant similarity threshold.

Target: `>= 0.80`.

## Utility

```
utility =
  0.25 * prediction_clarity +
  0.25 * falsifier_quality +
  0.25 * repair_actionability +
  0.25 * rejection_specificity
```

Target: `>= 0.50`.

## Maturation score (v0.2)

Maturation score is the mean pass rate of class-specific maturation gates across episodes.

- Per episode: `1` if all run-level maturation gates pass, else `0`
- Aggregate: average across episodes

Target: `>= 0.85`.

## Hard-fail policy (v0.2)

Release gate fails if any adversarial episode fails maturation (`adversarial_maturation_failure`), even when global averages are above threshold.

## Episode quality rule

Bad episodes are worse than fewer episodes.

Benchmark corpus must be:

1. diverse,
2. adversarial enough,
3. structured with expected outcomes.
