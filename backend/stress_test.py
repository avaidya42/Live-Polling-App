import asyncio
import time
import uuid

import httpx

BASE_URL = "http://localhost:8000"
CONCURRENT_UNIQUE_VOTERS = 50
CONCURRENT_DUPLICATE_ATTEMPTS = 20
CONCURRENT_READS = 30


async def create_test_poll(client: httpx.AsyncClient, options: list[str]) -> dict:
    resp = await client.post(
        f"{BASE_URL}/polls",
        json={"question": "Stress test poll", "options": options},
    )
    resp.raise_for_status()
    return resp.json()


async def cast_vote(client: httpx.AsyncClient, poll_id: str, option_id: str, fingerprint: str):
    return await client.post(
        f"{BASE_URL}/polls/{poll_id}/vote",
        json={"option_id": option_id, "voter_fingerprint": fingerprint},
    )


async def test_concurrent_unique_voters():
    print(f"\n[1] Concurrent unique voters ({CONCURRENT_UNIQUE_VOTERS} simultaneous votes)")
    async with httpx.AsyncClient(timeout=10) as client:
        poll = await create_test_poll(client, ["Option A", "Option B"])
        poll_id = poll["id"]

        poll_detail = await client.get(f"{BASE_URL}/polls/{poll_id}")
        options = poll_detail.json()["options"]
        option_ids = [o["id"] for o in options]

        # Split simultaneous voters across both options
        tasks = [
            cast_vote(client, poll_id, option_ids[i % 2], str(uuid.uuid4()))
            for i in range(CONCURRENT_UNIQUE_VOTERS)
        ]
        results = await asyncio.gather(*tasks)

        successes = sum(1 for r in results if r.status_code == 201)
        failures = [r for r in results if r.status_code != 201]

        results_resp = await client.get(f"{BASE_URL}/polls/{poll_id}/results")
        total_votes = results_resp.json()["total_votes"]

        print(f"    Requests sent:     {CONCURRENT_UNIQUE_VOTERS}")
        print(f"    Successful (201):  {successes}")
        print(f"    Failed:            {len(failures)}")
        print(f"    total_votes in DB: {total_votes}")

        if successes == CONCURRENT_UNIQUE_VOTERS and total_votes == CONCURRENT_UNIQUE_VOTERS:
            print("    PASS — every concurrent vote was counted exactly once, no lost updates.")
        else:
            print("    FAIL — vote_count doesn't match requests sent. Check the atomic UPDATE logic.")


async def test_concurrent_duplicate_votes():
    print(f"\n[2] Concurrent duplicate votes ({CONCURRENT_DUPLICATE_ATTEMPTS} simultaneous attempts, same voter)")
    async with httpx.AsyncClient(timeout=10) as client:
        poll = await create_test_poll(client, ["Yes", "No"])
        poll_id = poll["id"]

        poll_detail = await client.get(f"{BASE_URL}/polls/{poll_id}")
        option_id = poll_detail.json()["options"][0]["id"]

        same_fingerprint = str(uuid.uuid4())
        tasks = [
            cast_vote(client, poll_id, option_id, same_fingerprint)
            for _ in range(CONCURRENT_DUPLICATE_ATTEMPTS)
        ]
        results = await asyncio.gather(*tasks)

        successes = sum(1 for r in results if r.status_code == 201)
        conflicts = sum(1 for r in results if r.status_code == 409)
        other = [r.status_code for r in results if r.status_code not in (201, 409)]

        print(f"    Requests sent:  {CONCURRENT_DUPLICATE_ATTEMPTS}")
        print(f"    Succeeded (201): {successes}")
        print(f"    Rejected (409):  {conflicts}")
        if other:
            print(f"    Unexpected status codes: {other}")

        if successes == 1 and conflicts == CONCURRENT_DUPLICATE_ATTEMPTS - 1:
            print("    PASS — exactly one vote got through, all other simultaneous duplicates rejected.")
        else:
            print("    FAIL — more than one duplicate vote got through. Check the unique constraint.")


async def test_read_load():
    print(f"\n[3] Read load ({CONCURRENT_READS} simultaneous GET /results calls)")
    async with httpx.AsyncClient(timeout=10) as client:
        poll = await create_test_poll(client, ["A", "B", "C"])
        poll_id = poll["id"]

        start = time.perf_counter()
        tasks = [client.get(f"{BASE_URL}/polls/{poll_id}/results") for _ in range(CONCURRENT_READS)]
        results = await asyncio.gather(*tasks)
        elapsed = time.perf_counter() - start

        successes = sum(1 for r in results if r.status_code == 200)
        print(f"    Requests sent:    {CONCURRENT_READS}")
        print(f"    Successful (200): {successes}")
        print(f"    Total time:       {elapsed:.2f}s ({elapsed / CONCURRENT_READS * 1000:.0f}ms avg per request)")

        if successes == CONCURRENT_READS:
            print("    PASS — all concurrent reads succeeded.")
        else:
            print("    FAIL — some reads failed under concurrent load.")


async def main():
    print("=" * 60)
    print("Live Polling API — Stress Test")
    print(f"Target: {BASE_URL}")
    print("=" * 60)

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.get(f"{BASE_URL}/docs")
    except httpx.ConnectError:
        print(f"\nCould not reach {BASE_URL} — is `uvicorn main:app --reload` running?")
        return

    await test_concurrent_unique_voters()
    await test_concurrent_duplicate_votes()
    await test_read_load()

    print("\n" + "=" * 60)
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())