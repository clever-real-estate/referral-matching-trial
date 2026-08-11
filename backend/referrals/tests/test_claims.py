from datetime import timedelta

import pytest
from django.utils import timezone

from referrals.models import Claim, Offer, Referral, ReferralEvent

pytestmark = pytest.mark.django_db


@pytest.fixture
def pending_offer(make_agent, make_referral):
    agent = make_agent()
    referral = make_referral()
    return Offer.objects.create(
        referral=referral,
        agent=agent,
        score=0.9,
        eligibility_snapshot={"eligible": True, "reasons": []},
        expires_at=timezone.now() + timedelta(minutes=10),
    )


def test_agent_can_claim_pending_offer(pending_offer, client_for):
    client = client_for(pending_offer.agent.user)
    response = client.post(f"/api/offers/{pending_offer.id}/claim/")
    assert response.status_code == 200

    referral = Referral.objects.get(pk=pending_offer.referral_id)
    assert referral.status == Referral.Status.ASSIGNED
    assert referral.assigned_agent_id == pending_offer.agent_id
    assert Claim.objects.filter(referral=referral, agent=pending_offer.agent, active=True).exists()

    pending_offer.refresh_from_db()
    assert pending_offer.status == Offer.Status.ACCEPTED
    assert referral.events.filter(event_type=ReferralEvent.Type.CLAIM_SUCCEEDED).exists()


def test_agent_cannot_claim_expired_offer(pending_offer, client_for):
    Offer.objects.filter(pk=pending_offer.pk).update(
        expires_at=timezone.now() - timedelta(minutes=1)
    )
    client = client_for(pending_offer.agent.user)
    response = client.post(f"/api/offers/{pending_offer.id}/claim/")
    assert response.status_code == 400
    assert response.data["code"] == "offer_expired"


def test_agent_cannot_claim_someone_elses_offer(pending_offer, make_agent, client_for):
    other = make_agent("agent.other")
    client = client_for(other.user)
    response = client.post(f"/api/offers/{pending_offer.id}/claim/")
    assert response.status_code == 404


def test_agent_can_decline_offer(pending_offer, client_for):
    client = client_for(pending_offer.agent.user)
    response = client.post(f"/api/offers/{pending_offer.id}/decline/")
    assert response.status_code == 200

    pending_offer.refresh_from_db()
    assert pending_offer.status == Offer.Status.DECLINED
    assert pending_offer.referral.events.filter(
        event_type=ReferralEvent.Type.OFFER_DECLINED
    ).exists()


def test_queue_lists_pending_offers(pending_offer, client_for):
    client = client_for(pending_offer.agent.user)
    response = client.get("/api/offers/mine/")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["referral"]["external_id"] == pending_offer.referral.external_id
