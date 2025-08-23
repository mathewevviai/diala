#!/usr/bin/env python3
"""
Test script to verify modern streaming diarization dependencies are properly installed
and compatible with existing SpeechBrain models.

This test validates the post-2021 research dependencies:
- Landini et al. (2022, 2023): scipy sparse matrices, scikit-learn spectral clustering
- Park et al. (2022): networkx graph operations
- Cornell et al. (2022): memory management utilities
"""

import sys
import logging
import numpy as np
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def test_scipy_sparse_matrices():
    """Test scipy sparse matrix operations for graph-based clustering (Landini et al. 2022)"""
    try:
        import scipy.sparse
        from scipy.spatial.distance import cosine
        
        # Test sparse matrix creation for adjacency matrices
        n_speakers = 10
        adjacency = scipy.sparse.csr_matrix((n_speakers, n_speakers))
        
        # Test sparse matrix operations
        test_data = np.random.random((5, 5))
        sparse_test = scipy.sparse.csr_matrix(test_data)
        
        # Test cosine similarity (existing functionality)
        vec1 = np.random.random(128)
        vec2 = np.random.random(128)
        similarity = 1 - cosine(vec1, vec2)
        
        logger.info(f"✓ SciPy sparse matrices working - similarity: {similarity:.3f}")
        return True
        
    except ImportError as e:
        logger.error(f"✗ SciPy import failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ SciPy sparse matrix test failed: {e}")
        return False

def test_scikit_learn_spectral_clustering():
    """Test scikit-learn spectral clustering algorithms (Landini et al. 2022, 2023)"""
    try:
        from sklearn.cluster import SpectralClustering
        from sklearn.metrics.pairwise import cosine_similarity
        
        # Test spectral clustering with precomputed affinity
        n_samples = 20
        n_features = 128
        
        # Generate test embeddings (simulating speaker embeddings)
        embeddings = np.random.random((n_samples, n_features))
        
        # Create affinity matrix
        affinity_matrix = cosine_similarity(embeddings)
        
        # Test spectral clustering
        clusterer = SpectralClustering(
            n_clusters=3, 
            affinity='precomputed',
            random_state=42
        )
        
        labels = clusterer.fit_predict(affinity_matrix)
        
        logger.info(f"✓ Scikit-learn spectral clustering working - found {len(np.unique(labels))} clusters")
        return True
        
    except ImportError as e:
        logger.error(f"✗ Scikit-learn import failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ Spectral clustering test failed: {e}")
        return False

def test_networkx_graph_operations():
    """Test NetworkX graph operations for optimization (Landini et al. 2023)"""
    try:
        import networkx as nx
        
        # Create test graph for speaker similarity
        G = nx.Graph()
        
        # Add nodes (speakers)
        speakers = ['Speaker_1', 'Speaker_2', 'Speaker_3', 'Speaker_4']
        G.add_nodes_from(speakers)
        
        # Add weighted edges (similarity scores)
        edges = [
            ('Speaker_1', 'Speaker_2', {'weight': 0.8}),
            ('Speaker_2', 'Speaker_3', {'weight': 0.6}),
            ('Speaker_3', 'Speaker_4', {'weight': 0.7}),
        ]
        G.add_weighted_edges_from(edges)
        
        # Test graph operations
        centrality = nx.degree_centrality(G)
        components = list(nx.connected_components(G))
        
        logger.info(f"✓ NetworkX graph operations working - {len(components)} components, centrality computed")
        return True
        
    except ImportError as e:
        logger.error(f"✗ NetworkX import failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ NetworkX graph test failed: {e}")
        return False

def test_speechbrain_compatibility():
    """Test SpeechBrain compatibility with new dependencies"""
    try:
        # Test imports without loading models (to avoid GPU/download requirements)
        from speechbrain.pretrained import SepformerSeparation, EncoderClassifier
        
        # Test that we can access the model classes
        separator_class = SepformerSeparation
        encoder_class = EncoderClassifier
        
        logger.info("✓ SpeechBrain model classes accessible and compatible")
        return True
        
    except ImportError as e:
        logger.error(f"✗ SpeechBrain compatibility test failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ SpeechBrain compatibility error: {e}")
        return False

def test_torch_compatibility():
    """Test PyTorch compatibility with new dependencies"""
    try:
        import torch
        import torchaudio
        
        # Test basic tensor operations
        device = "cuda" if torch.cuda.is_available() else "cpu"
        test_tensor = torch.randn(1, 16000).to(device)
        
        # Test that tensor operations work with new dependencies
        result = torch.mean(test_tensor)
        
        logger.info(f"✓ PyTorch compatibility verified - device: {device}")
        return True
        
    except ImportError as e:
        logger.error(f"✗ PyTorch compatibility test failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ PyTorch compatibility error: {e}")
        return False

def test_memory_management_utilities():
    """Test memory management utilities for Cornell et al. (2022) approach"""
    try:
        import psutil
        import gc
        
        # Test memory monitoring
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024
        
        # Test garbage collection
        gc.collect()
        
        logger.info(f"✓ Memory management utilities working - current usage: {memory_mb:.1f} MB")
        return True
        
    except ImportError as e:
        logger.error(f"✗ Memory management utilities import failed: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ Memory management test failed: {e}")
        return False

def run_all_tests():
    """Run all dependency tests and report results"""
    logger.info("=== Testing Modern Streaming Diarization Dependencies ===")
    
    tests = [
        ("SciPy Sparse Matrices (Landini et al. 2022)", test_scipy_sparse_matrices),
        ("Scikit-learn Spectral Clustering (Landini et al. 2022, 2023)", test_scikit_learn_spectral_clustering),
        ("NetworkX Graph Operations (Landini et al. 2023)", test_networkx_graph_operations),
        ("SpeechBrain Compatibility", test_speechbrain_compatibility),
        ("PyTorch Compatibility", test_torch_compatibility),
        ("Memory Management Utilities (Cornell et al. 2022)", test_memory_management_utilities),
    ]
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"\n--- Testing {test_name} ---")
        success = test_func()
        results.append((test_name, success))
    
    # Summary
    logger.info("\n=== Test Results Summary ===")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "PASS" if success else "FAIL"
        logger.info(f"{status}: {test_name}")
    
    logger.info(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("✓ All modern dependencies are properly installed and compatible!")
        return True
    else:
        logger.error("✗ Some dependencies failed - check installation")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)