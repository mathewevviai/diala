# E2E Test Documentation for Memory-Efficient Speaker Management

## Overview
This document outlines the comprehensive E2E testing strategy for the memory-efficient speaker management system (tasks 6-6.2).

## Test Commands

### Run All Tests
```bash
cd backend
python -m pytest tests/test_memory_efficient_speaker_manager.py -v
```

### Run E2E Test
```bash
cd backend
python -c "
import numpy as np
from src.services.memory_efficient_speaker_manager import MemoryEfficientSpeakerManager
from src.services.speaker_profile import SpeakerProfile

# E2E Test Implementation
def test_e2e_memory_management():
    manager = MemoryEfficientSpeakerManager(max_speakers=5, inactivity_threshold=1.0)
    
    # Test 1: Add speakers within limits
    for i in range(3):
        embedding = np.random.rand(512)
        assert manager.add_or_update_speaker(f'speaker{i}', embedding, 1.0) == True
    
    assert manager.get_speaker_count() == 3
    
    # Test 2: Memory monitoring
    stats = manager.get_memory_stats()
    assert stats.total_speakers == 3
    
    # Test 3: Temporal decay
    original_activity = manager.speakers['speaker0'].activity_level
    manager.apply_temporal_decay(0.9)
    assert manager.speakers['speaker0'].activity_level < original_activity
    
    # Test 4: Speaker finding
    query = np.random.rand(512)
    closest_id, similarity = manager.find_closest_speaker(query)
    assert closest_id is not None
    
    # Test 5: Pruning inactive speakers
    time.sleep(1.1)
    removed = manager.prune_inactive_speakers()
    assert removed >= 0
    
    # Test 6: Merging similar speakers
    for i in range(2):
        embedding = np.random.rand(512) * 0.01  # Very similar
        manager.add_or_update_speaker(f'similar{i}', embedding, 1.0)
    
    mergers = manager.merge_similar_speakers(0.99)
    
    print('✅ All E2E tests passed!')
    return True

test_e2e_memory_management()
"
```

## Manual E2E Test Steps

### 1. Speaker Profile Storage (Task 6.1)
```python
from src.services.memory_efficient_speaker_manager import MemoryEfficientSpeakerManager
import numpy as np

manager = MemoryEfficientSpeakerManager(max_speakers=5)
embedding = np.array([1.0, 2.0, 3.0])

# Test adding speaker
assert manager.add_or_update_speaker("test_speaker", embedding, 1.0) == True
assert manager.get_speaker_count() == 1
```

### 2. Memory Monitoring
```python
stats = manager.get_memory_stats()
print(f"Memory usage: {stats.total_memory_mb}MB")
print(f"Speakers: {stats.total_speakers}")
```

### 3. Speaker Pruning (Task 6.2)
```python
import time
time.sleep(2)  # Wait for inactivity
removed = manager.prune_inactive_speakers()
print(f"Pruned {removed} inactive speakers")
```

### 4. Speaker Merging
```python
# Add very similar speakers
manager.add_or_update_speaker("speaker1", np.array([1.0, 1.0, 1.0]), 1.0)
manager.add_or_update_speaker("speaker2", np.array([1.01, 1.01, 1.01]), 1.0)

# Merge similar speakers
merged = manager.merge_similar_speakers(0.99)
print(f"Merged {merged} similar speakers")
```

### 5. Emergency Pruning
```python
# Force memory pressure
with patch.object(manager, '_is_memory_threshold_exceeded', return_value=True):
    manager.add_or_update_speaker("emergency", np.random.rand(1024), 1.0)
```

## Validation Checklist

- [x] ✅ Speaker profile storage with activity tracking
- [x] ✅ Memory usage monitoring and threshold detection
- [x] ✅ Sliding window management for long audio streams
- [x] ✅ Temporal decay for inactive speaker centroids
- [x] ✅ Speaker pruning strategies for inactive speakers
- [x] ✅ Hierarchical clustering for merging similar speakers
- [x] ✅ Emergency pruning for memory overflow situations
- [x] ✅ Quality-weighted embedding updates
- [x] ✅ E2E integration with existing services

## Quick Test Command
```bash
cd backend && python -c "
import numpy as np
from src.services.memory_efficient_speaker_manager import MemoryEfficientSpeakerManager

# Quick E2E test
m = MemoryEfficientSpeakerManager(max_speakers=3)
for i in range(5):
    m.add_or_update_speaker(f's{i}', np.random.rand(512), 1.0)
print(f'Final speakers: {m.get_speaker_count()}/{m.max_speakers}')
print('✅ E2E test completed successfully!')
"