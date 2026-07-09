
import os
import sys
import warnings
warnings.filterwarnings('ignore')

# Load .env before anything else
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

# Add backend dir to path so imports work
sys.path.insert(0, os.path.dirname(__file__))

from routes.employees  import bp as employees_bp
from routes.narratives import bp as narratives_bp
from routes.system     import bp as system_bp
from store             import ensure_db_attempt

app = Flask(__name__, static_folder=None)

# ── CORS ──────────────────────────────────────────────────────────────────────
allowed_origin = os.environ.get('CORS_ORIGIN', '*')
CORS(app, origins=allowed_origin, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

# ── Routes ────────────────────────────────────────────────────────────────────
app.register_blueprint(system_bp,     url_prefix='/api')
app.register_blueprint(employees_bp,  url_prefix='/api/employees')
app.register_blueprint(narratives_bp, url_prefix='/api/narratives')
# Also keep old prefix so legacy-cached frontend builds still work
app.register_blueprint(narratives_bp, url_prefix='/api/employees', name='narratives_legacy')

# ── Frontend static serving (dev / single-server mode) ───────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

if os.path.isdir(FRONTEND_DIST):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # Serve API routes through Flask blueprints above; everything else → SPA
        full = os.path.join(FRONTEND_DIST, path)
        if path and os.path.isfile(full):
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, 'index.html')
else:
    @app.route('/')
    def index():
        return jsonify({'status': 'LedgerLine Python Backend running', 'note': 'Frontend not built yet. Run: cd frontend && npm install && npm run build'})

# ── Startup ───────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"LedgerLine Python Backend starting on port {port}")
    ensure_db_attempt()
    app.run(host='0.0.0.0', port=port, debug=False)
