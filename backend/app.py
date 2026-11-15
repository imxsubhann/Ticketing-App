from flask import Flask, jsonify

from config import Config
from extensions import db, jwt, cors
from models import User


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    from routes.auth import auth_bp
    from routes.tickets import tickets_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(admin_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(_err):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(_err):
        return jsonify({"error": "Internal server error"}), 500

    with app.app_context():
        db.create_all()
        _seed_default_admin()

    return app


def _seed_default_admin():
    """Create a default admin account on first run so there's always a way in."""
    if User.query.filter_by(role="admin").first():
        return
    admin = User(name="Support Admin", email="admin@helpdesk.local", role="admin")
    admin.set_password("Admin@123")
    db.session.add(admin)
    db.session.commit()
    print("Seeded default admin -> email: admin@helpdesk.local  password: Admin@123")


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0",debug=True, port=5000)
