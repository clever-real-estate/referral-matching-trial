#!/usr/bin/env python3
"""Fire a burst of concurrent requests at an endpoint.

Useful for exercising the claim flow or the Operations dashboard under
concurrent load.

Examples:
    # Two concurrent claims for the same offer
    python tools/generate_load.py --method POST \
        --url http://127.0.0.1:8000/api/offers/42/claim/ \
        --token tok-agent.carol --count 2

    # Ten concurrent dashboard loads
    python tools/generate_load.py \
        --url http://127.0.0.1:8000/api/ops/referrals/ \
        --token tok-ops.riley --count 10
"""

import argparse
import threading
import time
import urllib.error
import urllib.request


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--token", required=True, help="API token (e.g. tok-agent.carol)")
    parser.add_argument("--method", default="GET", choices=["GET", "POST"])
    parser.add_argument("--count", type=int, default=5)
    args = parser.parse_args()

    barrier = threading.Barrier(args.count)
    results = []

    def worker(index):
        request = urllib.request.Request(
            args.url,
            method=args.method,
            headers={"Authorization": f"Token {args.token}"},
        )
        barrier.wait()
        started = time.monotonic()
        try:
            with urllib.request.urlopen(request) as response:
                body = response.read().decode()[:200]
                results.append((index, response.status, time.monotonic() - started, body))
        except urllib.error.HTTPError as error:
            body = error.read().decode()[:200]
            results.append((index, error.code, time.monotonic() - started, body))

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(args.count)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    for index, status_code, elapsed, body in sorted(results):
        print(f"request {index}: HTTP {status_code} in {elapsed:.2f}s  {body}")


if __name__ == "__main__":
    main()
