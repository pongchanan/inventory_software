# Vision Subsystem

This folder hosts the vision-first tracking stack for drawer-based inventory.

## Structure
- `controller/`: Edge orchestration (capture timing, drawer-close workflow, camera/lighting control)
- `inference/`: Computer vision and similarity inference pipelines
- `test/`: Vision-related tests and fixtures

## Notes
- Keep `controller` and `inference` concerns separate for readability.
- Do not place business API logic here; that belongs in `backend/`.
