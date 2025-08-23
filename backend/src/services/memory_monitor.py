# backend/src/services/memory_monitor.py
import os
import psutil

def get_memory_usage_mb() -> float:
    """Returns the current memory usage of the process in MB."""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)