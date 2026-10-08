"""Launch WASP FastAPI backend server."""
import sys
from pathlib import Path
src_dir = Path(__file__).parent / 'src'
sys.path.insert(0, str(src_dir))
import uvicorn
if __name__ == '__main__':
    uvicorn.run('api.main:app', host='0.0.0.0', port=8000, reload=True)
