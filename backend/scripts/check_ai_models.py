import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(r"c:\Users\OPLOR\Documents\University\Software project\inventory_software\backend")
sys.path.append(str(backend_path))

# Mock environment
os.environ["AI_RUNTIME_DIR"] = str(backend_path / "app" / "services" / "ai_pipeline_service" / ".ai_pipeline_runtime")

from app.services.ai_pipeline_service.ai_pipeline_helpers import build_detector
from app.services.ai_pipeline_service.ai_embedding_service import _ensure_model

def test_loading():
    print("--- Testing Detector Loading ---")
    try:
        detector = build_detector()
        print("✅ Detector build_detector() successful")
    except Exception as e:
        print(f"❌ Detector loading failed: {e}")

    print("\n--- Testing Recognizer Loading ---")
    try:
        model, transform, device = _ensure_model()
        print(f"✅ Recognizer _ensure_model() successful")
        print(f"   Model type: {type(model)}")
        print(f"   Device: {device}")
        
        # Check if it's Sequential (has head)
        import torch
        if isinstance(model, torch.nn.Sequential):
            print("   ✅ Triplet head confirmed (Sequential model)")
        else:
            print("   ℹ️ Backbone only model")
            
    except Exception as e:
        print(f"❌ Recognizer loading failed: {e}")

if __name__ == "__main__":
    test_loading()
