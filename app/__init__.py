from flask import Flask
from .models import db
from config import Config
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app)

    # Optionally, disable caching so Back doesn't load stale pages
    @app.after_request
    def add_header(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    # Register the blueprint
    from .routes import main_bp
    app.register_blueprint(main_bp)

    return app
