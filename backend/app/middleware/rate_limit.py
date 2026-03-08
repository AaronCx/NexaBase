"""Simple in-memory per-user rate limiting.

Uses a sliding window counter per user ID (extracted from JWT).
This is suitable for single-instance deployments. For multi-instance,
use Redis-based rate limiting instead.
"""

import time
import logging
from collections import defaultdict
from threading import Lock

logger = logging.getLogger(__name__)


class RateLimiter:
    def __init__(self, max_requests: int = 60, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str) -> tuple[bool, int]:
        """Check if a request is allowed for the given key.

        Returns (allowed, remaining_requests).
        """
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            # Clean expired entries
            self._requests[key] = [
                t for t in self._requests[key] if t > window_start
            ]

            current_count = len(self._requests[key])

            if current_count >= self.max_requests:
                return False, 0

            self._requests[key].append(now)
            remaining = self.max_requests - current_count - 1
            return True, remaining

    def cleanup(self):
        """Remove expired entries to prevent memory growth."""
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            expired_keys = []
            for key, timestamps in self._requests.items():
                self._requests[key] = [t for t in timestamps if t > window_start]
                if not self._requests[key]:
                    expired_keys.append(key)
            for key in expired_keys:
                del self._requests[key]


# Global rate limiter instances
# Chat: 30 requests per minute per user
chat_limiter = RateLimiter(max_requests=30, window_seconds=60)

# Auth: 10 requests per minute per IP (brute force protection)
auth_limiter = RateLimiter(max_requests=10, window_seconds=60)

# General API: 120 requests per minute per user
api_limiter = RateLimiter(max_requests=120, window_seconds=60)
