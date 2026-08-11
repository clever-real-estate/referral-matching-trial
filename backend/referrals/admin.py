from django.contrib import admin

from .models import Agent, Claim, Offer, Referral, ReferralEvent

admin.site.register(Agent)
admin.site.register(Referral)
admin.site.register(Offer)
admin.site.register(Claim)
admin.site.register(ReferralEvent)
