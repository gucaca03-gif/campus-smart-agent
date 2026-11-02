import os
import sys
from pathlib import Path

import uvicorn

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("AISHIDA_HOST", "0.0.0.0"),
        port=int(os.getenv("AISHIDA_PORT", "5600")),
        reload=False,
    )