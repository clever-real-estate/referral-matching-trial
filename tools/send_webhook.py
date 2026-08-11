#!/usr/bin/env python3
"""Send a synthetic intake webhook to the local backend.

Examples:
    python tools/send_webhook.py
    python tools/send_webhook.py --state TX --price 700000
    python tools/send_webhook.py --external-id lead-55555 --repeat 2
"""

import argparse
import json
import random
import urllib.request

MARKET_ZIPS = {"CO": "802", "TX": "750", "GA": "303", "FL": "331", "AZ": "850"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:8000/api/webhooks/referrals/")
    parser.add_argument("--token", default="dev-webhook-secret")
    parser.add_argument("--state", default="CO", choices=sorted(MARKET_ZIPS))
    parser.add_argument("--price", type=int, default=None)
    parser.add_argument("--intent", default="hot", choices=["browsing", "warm", "hot"])
    parser.add_argument("--external-id", default=None)
    parser.add_argument(
        "--repeat", type=int, default=1, help="Send the payload this many times"
    )
    parser.add_argument(
        "--same-event-id",
        action="store_true",
        help="Reuse one event_id across repeats (an upstream retry)",
    )
    args = parser.parse_args()

    n = random.randint(10_000, 99_999)
    external_id = args.external_id or f"lead-{n}"
    base_event_id = f"evt-{n}-{random.randint(100, 999)}"

    for attempt in range(args.repeat):
        event_id = base_event_id if args.same_event_id else f"{base_event_id}-{attempt}"
        payload = {
            "event_id": event_id,
            "external_id": external_id,
            "customer_name": "Skyler Testerson",
            "customer_email": f"skyler.testerson{n}@example.com",
            "customer_phone": f"555-01{random.randint(10, 99)}",
            "state": args.state,
            "postal_code": f"{MARKET_ZIPS[args.state]}{random.randint(10, 99)}",
            "estimated_price": args.price or random.randrange(300_000, 900_000, 25_000),
            "intent_level": args.intent,
        }
        request = urllib.request.Request(
            args.url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "X-Webhook-Token": args.token},
        )
        with urllib.request.urlopen(request) as response:
            print(f"[{attempt + 1}/{args.repeat}] {response.status}: {response.read().decode()}")


if __name__ == "__main__":
    main()
