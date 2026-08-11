"""Audit/event trail helpers."""

from .models import ReferralEvent


def record_event(referral, event_type, actor="", payload=None):
    return ReferralEvent.objects.create(
        referral=referral,
        event_type=event_type,
        actor=actor,
        payload=payload or {},
    )
