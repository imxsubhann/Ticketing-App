from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from extensions import db
from models import Ticket, TicketComment, VALID_PRIORITIES
from utils import current_user

tickets_bp = Blueprint("tickets", __name__, url_prefix="/api/tickets")


@tickets_bp.post("")
@jwt_required()
def create_ticket():
    user = current_user()
    data = request.get_json(silent=True) or {}

    subject = (data.get("subject") or "").strip()
    description = (data.get("description") or "").strip()
    category = (data.get("category") or "general").strip() or "general"
    priority = (data.get("priority") or "medium").strip().lower()

    if not subject or not description:
        return jsonify({"error": "Subject and description are required"}), 400
    if priority not in VALID_PRIORITIES:
        priority = "medium"

    ticket = Ticket(
        subject=subject,
        description=description,
        category=category,
        priority=priority,
        status="open",
        user_id=user.id,
        ticket_number="PENDING",
    )
    db.session.add(ticket)
    db.session.flush()  # assign ticket.id without committing yet
    ticket.ticket_number = f"TCK-{ticket.id:06d}"

    db.session.add(
        TicketComment(
            ticket_id=ticket.id,
            author_id=user.id,
            body="Ticket submitted.",
            is_status_change=True,
        )
    )
    db.session.commit()

    return jsonify({"ticket": ticket.to_dict(include_comments=True)}), 201


@tickets_bp.get("")
@jwt_required()
def list_my_tickets():
    user = current_user()
    status = request.args.get("status")

    query = Ticket.query.filter_by(user_id=user.id)
    if status:
        query = query.filter_by(status=status)
    tickets = query.order_by(Ticket.created_at.desc()).all()

    return jsonify({"tickets": [t.to_dict() for t in tickets]}), 200


@tickets_bp.get("/<int:ticket_id>")
@jwt_required()
def get_ticket(ticket_id):
    user = current_user()
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.user_id != user.id and user.role != "admin":
        return jsonify({"error": "You do not have access to this ticket"}), 403

    return jsonify({"ticket": ticket.to_dict(include_comments=True)}), 200


@tickets_bp.post("/<int:ticket_id>/comments")
@jwt_required()
def add_comment(ticket_id):
    user = current_user()
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.user_id != user.id and user.role != "admin":
        return jsonify({"error": "You do not have access to this ticket"}), 403

    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return jsonify({"error": "Comment body is required"}), 400

    comment = TicketComment(ticket_id=ticket.id, author_id=user.id, body=body)
    db.session.add(comment)

    # A user replying to a resolved/closed ticket reopens it for the queue
    if user.role != "admin" and ticket.status in ("resolved", "closed"):
        ticket.status = "open"

    db.session.commit()

    return jsonify({"ticket": ticket.to_dict(include_comments=True)}), 201
