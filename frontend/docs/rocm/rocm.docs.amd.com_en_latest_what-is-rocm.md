Title: What is ROCm? — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/what-is-rocm.html

Markdown Content:
Contents
--------

*   [ROCm components](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#rocm-components)
    *   [Libraries](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#libraries)
        *   [Machine Learning & Computer Vision](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#machine-learning-computer-vision)
        *   [Communication](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#communication)
        *   [Math](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#math)
        *   [Primitives](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#primitives)

    *   [Tools](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#tools)
        *   [System Management](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#system-management)
        *   [Performance](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#performance)
        *   [Development](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#development)

    *   [Compilers](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#compilers)
    *   [Runtimes](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#runtimes)

What is ROCm?[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#what-is-rocm "Link to this heading")
-----------------------------------------------------------------------------------------------------------

2025-05-30

6 min read time

Applies to Linux and Windows

ROCm is a software stack, composed primarily of open-source software, that provides the tools for programming AMD Graphics Processing Units (GPUs), from low-level kernels to high-level end-user applications.

[![Image 1: AMD's ROCm software stack and enabling technologies.](https://rocm.docs.amd.com/en/latest/_images/rocm-software-stack-6_4_0.jpg)](https://rocm.docs.amd.com/en/latest/_images/rocm-software-stack-6_4_0.jpg)
Specifically, ROCm provides the tools for [HIP (Heterogeneous-computing Interface for Portability)](https://rocm.docs.amd.com/projects/HIP/en/latest/index.html "(in HIP Documentation v6.4.43483)"), OpenCL and OpenMP. These include compilers, libraries for high-level functions, debuggers, profilers and runtimes.

ROCm components[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#rocm-components "Link to this heading")
----------------------------------------------------------------------------------------------------------------

ROCm consists of the following components. For information on the license associated with each component, see [ROCm licensing](https://rocm.docs.amd.com/en/latest/about/license.html).

### Libraries[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#libraries "Link to this heading")

#### Machine Learning & Computer Vision[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#machine-learning-computer-vision "Link to this heading")

| Component | Description |
| --- | --- |
| [Composable Kernel](https://rocm.docs.amd.com/projects/composable_kernel/en/latest/index.html "(in Composable Kernel Documentation v1.1.0)") | Provides a programming model for writing performance critical kernels for machine learning workloads across multiple architectures |
| [MIGraphX](https://rocm.docs.amd.com/projects/AMDMIGraphX/en/latest/index.html "(in MIGraphX v2.12.0)") | Graph inference engine that accelerates machine learning model inference |
| [MIOpen](https://rocm.docs.amd.com/projects/MIOpen/en/latest/index.html "(in MIOpen Documentation v3.4.0)") | An open source deep-learning library |
| [MIVisionX](https://rocm.docs.amd.com/projects/MIVisionX/en/latest/index.html "(in MIVisionX Documentation v3.2.0)") | Set of comprehensive computer vision and machine learning libraries, utilities, and applications |
| [ROCm Performance Primitives (RPP)](https://rocm.docs.amd.com/projects/rpp/en/latest/index.html "(in RPP documentation v1.9.10)") | Comprehensive high-performance computer vision library for AMD processors with HIP/OpenCL/CPU back-ends |
| [rocAL](https://rocm.docs.amd.com/projects/rocAL/en/latest/index.html "(in rocAL Documentation v2.2.0)") | An augmentation library designed to decode and process images and videos |
| [rocDecode](https://rocm.docs.amd.com/projects/rocDecode/en/latest/index.html "(in rocDecode documentation v0.10.0)") | High-performance SDK for access to video decoding features on AMD GPUs |
| [rocJPEG](https://rocm.docs.amd.com/projects/rocJPEG/en/latest/index.html "(in rocJPEG Documentation v0.8.0)") | Library for decoding JPG images on AMD GPUs |
| [rocPyDecode](https://rocm.docs.amd.com/projects/rocPyDecode/en/latest/index.html "(in rocPyDecode v0.3.1)") | Provides access to rocDecode APIs in both Python and C/C++ languages |

#### Communication[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#communication "Link to this heading")

| Component | Description |
| --- | --- |
| [RCCL](https://rocm.docs.amd.com/projects/rccl/en/latest/index.html "(in RCCL Documentation v2.22.3)") | Standalone library that provides multi-GPU and multi-node collective communication primitives |
| [rocSHMEM](https://rocm.docs.amd.com/projects/rocSHMEM/en/latest/index.html "(in rocSHMEM v2.0.0)") | An intra-kernel networking library that provides GPU-centric networking through an OpenSHMEM-like interface |

#### Math[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#math "Link to this heading")

| Component | Description |
| --- | --- |
| [half](https://github.com/ROCm/half/) | C++ header-only library that provides an IEEE 754 conformant, 16-bit half-precision floating-point type, along with corresponding arithmetic operators, type conversions, and common mathematical functions |
| [hipBLAS](https://rocm.docs.amd.com/projects/hipBLAS/en/latest/index.html "(in hipBLAS Documentation v2.4.0)") | BLAS-marshaling library that supports [rocBLAS](https://rocm.docs.amd.com/projects/rocBLAS/en/latest/index.html "(in rocBLAS Documentation v4.4.0)") and cuBLAS backends |
| [hipBLASLt](https://rocm.docs.amd.com/projects/hipBLASLt/en/latest/index.html "(in hipBLASLt Documentation v0.12.1)") | Provides general matrix-matrix operations with a flexible API and extends functionalities beyond traditional BLAS library |
| [hipFFT](https://rocm.docs.amd.com/projects/hipFFT/en/latest/index.html "(in hipFFT Documentation v1.0.18)") | Fast Fourier transforms (FFT)-marshalling library that supports rocFFT or cuFFT backends |
| [hipfort](https://rocm.docs.amd.com/projects/hipfort/en/latest/index.html "(in hipfort Documentation v0.6.0)") | Fortran interface library for accessing GPU Kernels |
| [hipRAND](https://rocm.docs.amd.com/projects/hipRAND/en/latest/index.html "(in hipRAND Documentation v2.12.0)") | Ports CUDA applications that use the cuRAND library into the HIP layer |
| [hipSOLVER](https://rocm.docs.amd.com/projects/hipSOLVER/en/latest/index.html "(in hipSOLVER Documentation v2.4.0)") | An LAPACK-marshalling library that supports [rocSOLVER](https://rocm.docs.amd.com/projects/rocSOLVER/en/latest/index.html "(in rocSOLVER Documentation v3.28.0)") and cuSOLVER backends |
| [hipSPARSE](https://rocm.docs.amd.com/projects/hipSPARSE/en/latest/index.html "(in hipSPARSE Documentation v3.2.0)") | SPARSE-marshalling library that supports [rocSPARSE](https://rocm.docs.amd.com/projects/rocSPARSE/en/latest/index.html "(in rocSPARSE Documentation v3.4.0)") and cuSPARSE backends |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/index.html "(in hipSPARSELt Documentation v0.2.3)") | SPARSE-marshalling library with multiple supported backends |
| [rocALUTION](https://rocm.docs.amd.com/projects/rocALUTION/en/latest/index.html "(in rocALUTION Documentation v3.2.3)") | Sparse linear algebra library for exploring fine-grained parallelism on ROCm runtime and toolchains |
| [rocBLAS](https://rocm.docs.amd.com/projects/rocBLAS/en/latest/index.html "(in rocBLAS Documentation v4.4.0)") | BLAS implementation (in the HIP programming language) on the ROCm runtime and toolchains |
| [rocFFT](https://rocm.docs.amd.com/projects/rocFFT/en/latest/index.html "(in rocFFT Documentation v1.0.32)") | Software library for computing fast Fourier transforms (FFTs) written in HIP |
| [rocRAND](https://rocm.docs.amd.com/projects/rocRAND/en/latest/index.html "(in rocRAND Documentation v3.3.0)") | Provides functions that generate pseudorandom and quasirandom numbers |
| [rocSOLVER](https://rocm.docs.amd.com/projects/rocSOLVER/en/latest/index.html "(in rocSOLVER Documentation v3.28.0)") | An implementation of LAPACK routines on ROCm software, implemented in the HIP programming language and optimized for AMD’s latest discrete GPUs |
| [rocSPARSE](https://rocm.docs.amd.com/projects/rocSPARSE/en/latest/index.html "(in rocSPARSE Documentation v3.4.0)") | Exposes a common interface that provides BLAS for sparse computation implemented on ROCm runtime and toolchains (in the HIP programming language) |
| [rocWMMA](https://rocm.docs.amd.com/projects/rocWMMA/en/latest/index.html "(in rocWMMA Documentation v1.7.0)") | C++ library for accelerating mixed-precision matrix multiply-accumulate (MMA) operations |
| [Tensile](https://rocm.docs.amd.com/projects/Tensile/en/latest/src/index.html "(in Tensile Documentation v4.43.0)") | Creates benchmark-driven backend libraries for GEMMs, GEMM-like problems, and general N-dimensional tensor contractions |

#### Primitives[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#primitives "Link to this heading")

| Component | Description |
| --- | --- |
| [hipCUB](https://rocm.docs.amd.com/projects/hipCUB/en/latest/index.html "(in hipCUB Documentation v3.4.0)") | Thin header-only wrapper library on top of [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/latest/index.html "(in rocPRIM Documentation v3.4.0)") or CUB that allows project porting using the CUB library to the HIP layer |
| [hipTensor](https://rocm.docs.amd.com/projects/hipTensor/en/latest/index.html "(in hipTensor Documentation v1.5.0)") | AMD’s C++ library for accelerating tensor primitives based on the composable kernel library |
| [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/latest/index.html "(in rocPRIM Documentation v3.4.0)") | Header-only library for HIP parallel primitives |
| [rocThrust](https://rocm.docs.amd.com/projects/rocThrust/en/latest/index.html "(in rocThrust Documentation v3.3.0)") | Parallel algorithm library |

### Tools[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#tools "Link to this heading")

#### System Management[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#system-management "Link to this heading")

| Component | Description |
| --- | --- |
| [AMD SMI](https://rocm.docs.amd.com/projects/amdsmi/en/latest/index.html "(in AMD SMI v25.4.0)") | C library for Linux that provides a user space interface for applications to monitor and control AMD devices |
| [ROCm Data Center Tool](https://rocm.docs.amd.com/projects/rdc/en/latest/index.html "(in ROCm Data Center Documentation)") | Simplifies administration and addresses key infrastructure challenges in AMD GPUs in cluster and data-center environments |
| [rocminfo](https://rocm.docs.amd.com/projects/rocminfo/en/latest/index.html "(in rocminfo v1.0.0)") | Reports system information |
| [ROCm SMI](https://rocm.docs.amd.com/projects/rocm_smi_lib/en/latest/index.html "(in ROCm SMI LIB Documentation v7.6.0)") | C library for Linux that provides a user space interface for applications to monitor and control GPU applications |
| [ROCm Validation Suite](https://rocm.docs.amd.com/projects/ROCmValidationSuite/en/latest/index.html "(in RVS Documentation v1.1.0)") | Detects and troubleshoots common problems affecting AMD GPUs running in a high-performance computing environment |

#### Performance[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#performance "Link to this heading")

| Component | Description |
| --- | --- |
| [ROCm Bandwidth Test](https://rocm.docs.amd.com/projects/rocm_bandwidth_test/en/latest/index.html "(in rocm_bandwidth_test)") | Captures the performance characteristics of buffer copying and kernel read/write operations |
| [ROCm Compute Profiler](https://rocm.docs.amd.com/projects/rocprofiler-compute/en/latest/index.html "(in ROCm Compute Profiler v3.1.0)") | Kernel-level profiling for machine learning and high performance computing (HPC) workloads |
| [ROCm Systems Profiler](https://rocm.docs.amd.com/projects/rocprofiler-systems/en/latest/index.html "(in rocprofiler-systems v1.0.1)") | Comprehensive profiling and tracing of applications running on the CPU or the CPU and GPU |
| [ROCProfiler](https://rocm.docs.amd.com/projects/rocprofiler/en/latest/index.html "(in rocprofiler Documentation v2.0.0)") | Profiling tool for HIP applications |
| [ROCprofiler-SDK](https://rocm.docs.amd.com/projects/rocprofiler-sdk/en/latest/index.html "(in Rocprofiler SDK v0.6.0)") | Toolkit for developing analysis tools for profiling and tracing GPU compute applications. This toolkit is in beta and subject to change |
| [ROCTracer](https://rocm.docs.amd.com/projects/roctracer/en/latest/index.html "(in roctracer Documentation v4.1.0)") | Intercepts runtime API calls and traces asynchronous activity |

#### Development[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#development "Link to this heading")

| Component | Description |
| --- | --- |
| [HIPIFY](https://rocm.docs.amd.com/projects/HIPIFY/en/latest/index.html "(in HIPIFY Documentation)") | Translates CUDA source code into portable HIP C++ |
| [ROCm CMake](https://rocm.docs.amd.com/projects/ROCmCMakeBuildTools/en/latest/index.html "(in ROCm CMake Build Tools v0.14.0)") | Collection of CMake modules for common build and development tasks |
| [ROCdbgapi](https://rocm.docs.amd.com/projects/ROCdbgapi/en/latest/index.html "(in ROCdbgapi Documentation v0.77.2)") | ROCm debugger API library |
| [ROCm Debugger (ROCgdb)](https://rocm.docs.amd.com/projects/ROCgdb/en/latest/index.html "(in ROCgdb Documentation v15.2)") | Source-level debugger for Linux, based on the GNU Debugger (GDB) |
| [ROCr Debug Agent](https://rocm.docs.amd.com/projects/rocr_debug_agent/en/latest/index.html "(in rocr_debug_agent v2.0.4)") | Prints the state of all AMD GPU wavefronts that caused a queue error by sending a SIGQUIT signal to the process while the program is running |

### Compilers[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#compilers "Link to this heading")

| Component | Description |
| --- | --- |
| [HIPCC](https://rocm.docs.amd.com/projects/HIPCC/en/latest/index.html "(in HIPCC Documentation v1.1.1)") | Compiler driver utility that calls Clang or NVCC and passes the appropriate include and library options for the target compiler and HIP infrastructure |
| [ROCm compilers](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html "(in llvm-project Documentation v19.0.0)") | ROCm LLVM compiler infrastructure |
| [FLANG](https://github.com/ROCm/flang/) | An out-of-tree Fortran compiler targeting LLVM |

### Runtimes[#](https://rocm.docs.amd.com/en/latest/what-is-rocm.html#runtimes "Link to this heading")

| Component | Description |
| --- | --- |
| [AMD Compute Language Runtime (CLR)](https://rocm.docs.amd.com/projects/HIP/en/latest/understand/amd_clr.html "(in HIP Documentation v6.4.43483)") | Contains source code for AMD’s compute language runtimes: HIP and OpenCL |
| [HIP](https://rocm.docs.amd.com/projects/HIP/en/latest/index.html "(in HIP Documentation v6.4.43483)") | AMD’s GPU programming language extension and the GPU runtime |
| [ROCR-Runtime](https://rocm.docs.amd.com/projects/ROCR-Runtime/en/latest/index.html "(in ROCR Documentation v1.15.0)") | User-mode API interfaces and libraries necessary for host applications to launch compute kernels on available HSA ROCm kernel agents |
