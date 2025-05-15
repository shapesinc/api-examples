import time

class RateLimiter:
    def __init__(self, rpm: int = 5):
        self.wait_time = 16.5  # ≈3.6 req/min, leaves room for 2 retries
        self._last_request = 0.0

    def wait_if_needed(self):
        now = time.time()
        wait_time = self.wait_time - (now - self._last_request)
        if wait_time > 0:
            print(f"Rate limit: waiting {self.wait_time:.1f} s...")
            time.sleep(wait_time)
        self._last_request = time.time() 