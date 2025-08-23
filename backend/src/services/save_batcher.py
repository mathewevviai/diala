import asyncio
import logging

class SaveBatcher:
    """
    Incrementally save leads in batches. Starts a periodic background flusher on `start()`.
    supply a coroutine `save_fn(items)` that persists a list of leads.
    """
    def __init__(self, save_fn, batch_size: int = 50, flush_interval: int = 5):
        self.save_fn = save_fn
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self._queue = []
        self._lock = asyncio.Lock()
        self._task = None

    async def start(self):
        if not self._task:
            self._task = asyncio.create_task(self._periodic_flush())

    async def add(self, item: dict):
        async with self._lock:
            self._queue.append(item)
            if len(self._queue) >= self.batch_size:
                await self._flush_locked()

    async def _periodic_flush(self):
        while True:
            await asyncio.sleep(self.flush_interval)
            async with self._lock:
                if self._queue:
                    await self._flush_locked()

    async def _flush_locked(self):
        if not self._queue:
            return
        batch = self._queue
        self._queue = []
        try:
            await self.save_fn(batch)
        except Exception as e:
            logging.exception("SaveBatcher flush failed, requeueing")
            # naive retry: put items back at head
            self._queue = batch + self._queue

    async def drain(self) -> list:
        """Flush and return the set of saved (or pending) items for final dedupe step."""
        async with self._lock:
            pending = self._queue
            self._queue = []
        if pending:
            try:
                await self.save_fn(pending)
            except Exception:
                # if final flush fails, leave pending for manual inspection
                pass
        return pending