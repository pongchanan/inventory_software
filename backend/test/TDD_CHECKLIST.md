# TDD Checklist

Use this checklist for each feature or bug fix.

1. Define expected behavior in 1-2 sentences.
2. Write a failing test for that behavior.
3. Run only the target test and confirm it fails.
4. Implement minimal code to satisfy the test.
5. Run full automated suite (`pytest`) and confirm pass.
6. Refactor implementation while keeping tests green.
7. If contract changed, update docs and add/adjust contract tests.

## Marker Guidance

- `@pytest.mark.unit`: no network, no external services.
- `@pytest.mark.integration`: cross-component behavior inside backend.
- `@pytest.mark.contract`: request/response and schema guarantees.
- `manual`: hardware/external dependencies, run explicitly only.
