from datetime import datetime, timezone

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


VALID_STATUSES = ["open", "in_progress", "resolved", "closed"]
VALID_PRIORITIES = ["low", "medium", "high", "urgent"]


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")  # 'user' | 'admin'
    created_at = db.Column(db.DateTime, default=utcnow)

    tickets = db.relationship(
        "Ticket", backref="requester", lazy=True, foreign_keys="Ticket.user_id"
    )

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(60), default="general")
    priority = db.Column(db.String(20), default="medium")
    status = db.Column(db.String(20), default="open", index=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assigned_admin_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    comments = db.relationship(
        "TicketComment",
        backref="ticket",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="TicketComment.created_at",
    )
    assigned_admin = db.relationship("User", foreign_keys=[assigned_admin_id])

    def to_dict(self, include_comments=False):
        data = {
            "id": self.id,
            "ticket_number": self.ticket_number,
            "subject": self.subject,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "status": self.status,
            "requester": {
                "id": self.requester.id,
                "name": self.requester.name,
                "email": self.requester.email,
            }
            if self.requester
            else None,
            "assigned_admin": {
                "id": self.assigned_admin.id,
                "name": self.assigned_admin.name,
            }
            if self.assigned_admin
            else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_comments:
            data["comments"] = [c.to_dict() for c in self.comments]
        return data


class TicketComment(db.Model):
    __tablename__ = "ticket_comments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_status_change = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    author = db.relationship("User", foreign_keys=[author_id])

    def to_dict(self):
        return {
            "id": self.id,
            "body": self.body,
            "is_status_change": self.is_status_change,
            "author": {
                "id": self.author.id,
                "name": self.author.name,
                "role": self.author.role,
            }
            if self.author
            else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
