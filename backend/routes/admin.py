from flask import Blueprint, request, jsonify

from extensions import db
from models import Ticket, TicketComment, User, VALID_STATUSES, VALID_PRIORITIES
from utils import admin_required, current_user

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.get("/tickets")
@admin_required
def list_all_tickets():
    status = request.args.get("status")
    priority = request.args.get("priority")
    search = request.args.get("search", "").strip()

    query = Ticket.query
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    if search:
        like = f"%{search}%"
        query = query.join(User, Ticket.user_id == User.id).filter(
            db.or_(
                Ticket.subject.ilike(like),
                Ticket.ticket_number.ilike(like),
                User.name.ilike(like),
                User.email.ilike(like),
            )
        )

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return jsonify({"tickets": [t.to_dict() for t in tickets]}), 200


@admin_bp.get("/tickets/<int:ticket_id>")
@admin_required
def get_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    return jsonify({"ticket": ticket.to_dict(include_comments=True)}), 200


@admin_bp.patch("/tickets/<int:ticket_id>")
@admin_required
def update_ticket(ticket_id):
    admin = current_user()
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json(silent=True) or {}

    changes = []

    new_status = data.get("status")
    if new_status is not None:
        if new_status not in VALID_STATUSES:
            return jsonify({"error": f"status must be one of {VALID_STATUSES}"}), 400
        if new_status != ticket.status:
            changes.append(f"Status changed from '{ticket.status}' to '{new_status}'.")
            ticket.status = new_status

    new_priority = data.get("priority")
    if new_priority is not None:
        if new_priority not in VALID_PRIORITIES:
            return jsonify({"error": f"priority must be one of {VALID_PRIORITIES}"}), 400
        if new_priority != ticket.priority:
            changes.append(f"Priority changed from '{ticket.priority}' to '{new_priority}'.")
            ticket.priority = new_priority

    if "assigned_admin_id" in data:
        new_admin_id = data.get("assigned_admin_id")
        if new_admin_id in (None, ""):
            if ticket.assigned_admin_id is not None:
                changes.append("Ticket unassigned.")
            ticket.assigned_admin_id = None
        else:
            admin_user = User.query.filter_by(id=new_admin_id, role="admin").first()
            if not admin_user:
                return jsonify({"error": "assigned_admin_id must be a valid admin user"}), 400
            if ticket.assigned_admin_id != admin_user.id:
                changes.append(f"Assigned to {admin_user.name}.")
            ticket.assigned_admin_id = admin_user.id

    for change_text in changes:
        db.session.add(
            TicketComment(
                ticket_id=ticket.id,
                author_id=admin.id,
                body=change_text,
                is_status_change=True,
            )
        )

    db.session.commit()
    return jsonify({"ticket": ticket.to_dict(include_comments=True)}), 200


@admin_bp.get("/stats")
@admin_required
def stats():
    counts = {status: Ticket.query.filter_by(status=status).count() for status in VALID_STATUSES}
    counts["total"] = Ticket.query.count()
    return jsonify({"stats": counts}), 200


@admin_bp.get("/admins")
@admin_required
def list_admins():
    admins = User.query.filter_by(role="admin").all()
    return jsonify({"admins": [a.to_dict() for a in admins]}), 200
