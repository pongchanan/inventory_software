# AI Vision Benchmark Runbook

This guide explains how to reproduce the AI-vision benchmark and regenerate its
report. It distinguishes between commands that can be run from this repository
today and the full evaluation pipeline, whose Python source and test data must
first be restored.

## Scope

The benchmark evaluates two capabilities:

1. **Object detection and recognition** — whether the model finds an item
   (bounding-box IoU >= 0.50) and assigns the correct item label.
2. **Cabinet change detection** — whether the before/after image comparison
   detects a change and locates its changed regions (region IoU >= 0.30).

The saved pilot used one held-out detection image with 50 ground-truth boxes and
47 labelled items, plus 14 before/after pairs for change detection. Treat these
results as a pilot baseline, not a release gate.

## Current repository state

The saved inputs and outputs are available at:

- `backend/.vision_eval/` — JSON predictions, metric reports, and run logs.
- `../reports/vision-model-benchmark-report-with-evidence.docx` — the generated
  benchmark report.
- `../build_vision_benchmark_report.py` — report-generation script.

The full evaluator source is **not currently available**. The folder
`backend/evaluation/` contains only compiled Python files in `__pycache__/`; it
does not contain the `.py` files or the `evaluation/data/` test dataset.
Therefore, do not expect the full benchmark commands below to run until those
sources and data are restored.

## Regenerate the report from saved results

This regenerates the Word report only; it does not rerun an AI model or alter
the benchmark JSON files.

From the project root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install pillow python-docx
python .\build_vision_benchmark_report.py
```

The output is written to:

```text
reports/vision-model-benchmark-report-with-evidence.docx
```

Before running, update `SOURCE_BACKEND`, `TEST_IMAGE`, and `ANNOTATION_FILE` at
the top of `build_vision_benchmark_report.py` if the original Year 3 prototype
is not present at the hard-coded location. The report script needs the original
annotated image and annotation JSON to render visual evidence.

## Restore prerequisites for a full rerun

Recover the following from the original prototype, Git history, or a backup and
place them under `backend/evaluation/`:

```text
evaluate.py
evaluate_changes.py
predict_existing_pipeline.py
predict_gemini.py
predict_embedding_recognizer.py
build_reference_embeddings.py
prepare_enrolled_references.py
change_detection.py
enrolled_references.py
data/                         # images, annotations, enrolled references
```

Install the backend dependencies:

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

The saved Gemini logs show that the previous run used OpenRouter. Restore the
same provider credentials in the backend `.env` file before rerunning any
cloud-model prediction. Keep keys out of source code and do not commit `.env`.

## Full benchmark procedure (after restoring the evaluator)

Run commands from `backend/`. The exact command-line flags must be checked
against the restored scripts; the original source is currently missing, so this
runbook intentionally does not invent flags.

1. **Freeze the dataset.** Put held-out images, annotations, and before/after
   pairs in `evaluation/data/`. Keep the same files for every model comparison.
2. **Build reference embeddings** when testing the embedding recognizer. The
   prior run built 389 enrolled-reference embeddings.
3. **Generate predictions per method.** Save each method's prediction JSON in
   `.vision_eval/` with a distinct, dated name. Use the same detection image and
   the same prompt/settings for every cloud model.
4. **Evaluate object detection and recognition.** Match predicted boxes to
   ground-truth boxes at IoU >= 0.50, then calculate detection precision,
   recall, F1, recognition accuracy, and end-to-end precision/recall/F1.
5. **Evaluate change detection.** Run the same image-pair set and calculate
   change-presence metrics plus changed-region metrics at region IoU >= 0.30.
6. **Review outputs.** Verify the counts and metrics in the generated JSON
   before publishing the report. Do not overwrite the original pilot JSON;
   write a new dated result instead.
7. **Regenerate the report** using the command in the earlier section after
   selecting the new result files in `../build_vision_benchmark_report.py`.

## Output checks

For an object-recognition report JSON, check that it includes:

```json
{
  "split": "val",
  "images": 1,
  "iou_threshold": 0.5,
  "detection": {"precision": 0, "recall": 0, "f1": 0},
  "recognition": {"expected": 0, "correct": 0, "accuracy": 0},
  "end_to_end": {"precision": 0, "recall": 0, "f1": 0}
}
```

For a change-detection report JSON, check that it records the method,
parameters, `change_presence`, and `summary` metrics. Existing examples are
`change-diff-val-final.json` and `change-diff-train-final.json` in
`.vision_eval/`.

## Recommended acceptance criteria

Define the release thresholds before comparing results. At minimum, require:

- a held-out validation set larger than the current one-image pilot;
- the same dataset and IoU rules for every candidate;
- no automatic borrow/return decision based on recognition alone unless the
  end-to-end metric meets the agreed threshold; and
- human review for low-confidence or ambiguous captures.

## Related files

- `backend/.vision_eval/*-report.json`
- `../build_vision_benchmark_report.py`
- `../reports/vision-model-benchmark-report-with-evidence.docx`
