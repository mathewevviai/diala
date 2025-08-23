Title: Compatibility matrix — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html

Markdown Content:
Compatibility matrix[#](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#compatibility-matrix "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------------------------

2025-06-04

35 min read time

Applies to Linux

Use this matrix to view the ROCm compatibility and system requirements across successive major and minor releases.

You can also refer to the [past versions of ROCm compatibility matrix](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#past-rocm-compatibility-matrix).

Accelerators and GPUs listed in the following table support compute workloads (no display information or graphics). If you’re using ROCm with AMD Radeon or Radeon Pro GPUs for graphics workloads, see the [Use ROCm on Radeon GPU documentation](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/compatibility.html) to verify compatibility and system requirements.

| ROCm Version | 6.4.1 | 6.4.0 | 6.3.0 |
| --- | --- | --- | --- |
| [Operating systems & kernels](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#os-kernel-versions) | Ubuntu 24.04.2 | Ubuntu 24.04.2 | Ubuntu 24.04.2 |
|  | Ubuntu 22.04.5 | Ubuntu 22.04.5 | Ubuntu 22.04.5 |
|  | RHEL 9.6, 9.5, 9.4 | RHEL 9.5, 9.4 | RHEL 9.5, 9.4 |
|  | RHEL 8.10 | RHEL 8.10 | RHEL 8.10 |
|  | SLES 15 SP6 | SLES 15 SP6 | SLES 15 SP6, SP5 |
|  | Oracle Linux 9, 8 [[1]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x) | Oracle Linux 9, 8 [[1]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x) | Oracle Linux 8.10 [[1]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x) |
|  | Debian 12 [[2]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#single-node) | Debian 12 [[2]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#single-node) |  |
|  | Azure Linux 3.0 [[1]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x) | Azure Linux 3.0 [[1]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x) |  |
|  |  |  |  |
| [Architecture](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html "(in ROCm installation on Linux v6.4.1)") | CDNA3 | CDNA3 | CDNA3 |
|  | CDNA2 | CDNA2 | CDNA2 |
|  | CDNA | CDNA | CDNA |
|  | RDNA4 |  |  |
|  | RDNA3 | RDNA3 | RDNA3 |
|  | RDNA2 | RDNA2 | RDNA2 |
|  |  |  |  |
| [GPU / LLVM target](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html "(in ROCm installation on Linux v6.4.1)") | gfx1201 [[6]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#rdna-os) |  |  |
|  | gfx1200 [[6]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#rdna-os) |  |  |
|  | gfx1101 [[6]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#rdna-os) |  |  |
|  | gfx1100 | gfx1100 | gfx1100 |
|  | gfx1030 | gfx1030 | gfx1030 |
|  | gfx942 | gfx942 | gfx942 |
|  | gfx90a | gfx90a | gfx90a |
|  | gfx908 | gfx908 | gfx908 |
|  |  |  |  |
| FRAMEWORK SUPPORT |  |  |  |
| [PyTorch](https://rocm.docs.amd.com/en/latest/compatibility/ml-compatibility/pytorch-compatibility.html) | 2.6, 2.5, 2.4, 2.3 | 2.6, 2.5, 2.4, 2.3 | 2.4, 2.3, 2.2, 2.1, 2.0, 1.13 |
| [TensorFlow](https://rocm.docs.amd.com/en/latest/compatibility/ml-compatibility/tensorflow-compatibility.html) | 2.18.1, 2.17.1, 2.16.2 | 2.18.1, 2.17.1, 2.16.2 | 2.17.0, 2.16.2, 2.15.1 |
| [JAX](https://rocm.docs.amd.com/en/latest/compatibility/ml-compatibility/jax-compatibility.html) | 0.4.35 | 0.4.35 | 0.4.31 |
| [ONNX Runtime](https://onnxruntime.ai/docs/build/eps.html#amd-migraphx) | 1.2 | 1.2 | 1.17.3 |
|  |  |  |  |
| THIRD PARTY COMMS |  |  |  |
| [UCC](https://github.com/ROCm/ucc) | >=1.3.0 | >=1.3.0 | >=1.3.0 |
| [UCX](https://github.com/ROCm/ucx) | >=1.15.0 | >=1.15.0 | >=1.15.0 |
|  |  |  |  |
| THIRD PARTY ALGORITHM |  |  |  |
| Thrust | 2.5.0 | 2.5.0 | 2.3.2 |
| CUB | 2.5.0 | 2.5.0 | 2.3.2 |
|  |  |  |  |
| KMD & USER SPACE [[4]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#kfd-support) |  |  |  |
| [KMD versions](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/user-kernel-space-compat-matrix.html "(in ROCm installation on Linux v6.4.1)") | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x |
|  |  |  |  |
| ML & COMPUTER VISION |  |  |  |
| [Composable Kernel](https://rocm.docs.amd.com/projects/composable_kernel/en/latest/index.html "(in Composable Kernel Documentation v1.1.0)") | 1.1.0 | 1.1.0 | 1.1.0 |
| [MIGraphX](https://rocm.docs.amd.com/projects/AMDMIGraphX/en/latest/index.html "(in MIGraphX v2.12.0)") | 2.12.0 | 2.12.0 | 2.11.0 |
| [MIOpen](https://rocm.docs.amd.com/projects/MIOpen/en/latest/index.html "(in MIOpen Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 |
| [MIVisionX](https://rocm.docs.amd.com/projects/MIVisionX/en/latest/index.html "(in MIVisionX Documentation v3.2.0)") | 3.2.0 | 3.2.0 | 3.1.0 |
| [rocAL](https://rocm.docs.amd.com/projects/rocAL/en/latest/index.html "(in rocAL Documentation v2.2.0)") | 2.2.0 | 2.2.0 | 2.1.0 |
| [rocDecode](https://rocm.docs.amd.com/projects/rocDecode/en/latest/index.html "(in rocDecode documentation v0.10.0)") | 0.10.0 | 0.10.0 | 0.8.0 |
| [rocJPEG](https://rocm.docs.amd.com/projects/rocJPEG/en/latest/index.html "(in rocJPEG Documentation v0.8.0)") | 0.8.0 | 0.8.0 | 0.6.0 |
| [rocPyDecode](https://rocm.docs.amd.com/projects/rocPyDecode/en/latest/index.html "(in rocPyDecode v0.3.1)") | 0.3.1 | 0.3.1 | 0.2.0 |
| [RPP](https://rocm.docs.amd.com/projects/rpp/en/latest/index.html "(in RPP documentation v1.9.10)") | 1.9.10 | 1.9.10 | 1.9.1 |
|  |  |  |  |
| COMMUNICATION |  |  |  |
| [RCCL](https://rocm.docs.amd.com/projects/rccl/en/latest/index.html "(in RCCL Documentation v2.22.3)") | 2.22.3 | 2.22.3 | 2.21.5 |
| [rocSHMEM](https://rocm.docs.amd.com/projects/rocSHMEM/en/latest/index.html "(in rocSHMEM v2.0.0)") | 2.0.0 | 2.0.0 | N/A |
|  |  |  |  |
| MATH LIBS |  |  |  |
| [half](https://github.com/ROCm/half) | 1.12.0 | 1.12.0 | 1.12.0 |
| [hipBLAS](https://rocm.docs.amd.com/projects/hipBLAS/en/latest/index.html "(in hipBLAS Documentation v2.4.0)") | 2.4.0 | 2.4.0 | 2.3.0 |
| [hipBLASLt](https://rocm.docs.amd.com/projects/hipBLASLt/en/latest/index.html "(in hipBLASLt Documentation v0.12.1)") | 0.12.1 | 0.12.0 | 0.10.0 |
| [hipFFT](https://rocm.docs.amd.com/projects/hipFFT/en/latest/index.html "(in hipFFT Documentation v1.0.18)") | 1.0.18 | 1.0.18 | 1.0.17 |
| [hipfort](https://rocm.docs.amd.com/projects/hipfort/en/latest/index.html "(in hipfort Documentation v0.6.0)") | 0.6.0 | 0.6.0 | 0.5.0 |
| [hipRAND](https://rocm.docs.amd.com/projects/hipRAND/en/latest/index.html "(in hipRAND Documentation v2.12.0)") | 2.12.0 | 2.12.0 | 2.11.0 |
| [hipSOLVER](https://rocm.docs.amd.com/projects/hipSOLVER/en/latest/index.html "(in hipSOLVER Documentation v2.4.0)") | 2.4.0 | 2.4.0 | 2.3.0 |
| [hipSPARSE](https://rocm.docs.amd.com/projects/hipSPARSE/en/latest/index.html "(in hipSPARSE Documentation v3.2.0)") | 3.2.0 | 3.2.0 | 3.1.2 |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/index.html "(in hipSPARSELt Documentation v0.2.3)") | 0.2.3 | 0.2.3 | 0.2.2 |
| [rocALUTION](https://rocm.docs.amd.com/projects/rocALUTION/en/latest/index.html "(in rocALUTION Documentation v3.2.3)") | 3.2.3 | 3.2.2 | 3.2.1 |
| [rocBLAS](https://rocm.docs.amd.com/projects/rocBLAS/en/latest/index.html "(in rocBLAS Documentation v4.4.0)") | 4.4.0 | 4.4.0 | 4.3.0 |
| [rocFFT](https://rocm.docs.amd.com/projects/rocFFT/en/latest/index.html "(in rocFFT Documentation v1.0.32)") | 1.0.32 | 1.0.32 | 1.0.31 |
| [rocRAND](https://rocm.docs.amd.com/projects/rocRAND/en/latest/index.html "(in rocRAND Documentation v3.3.0)") | 3.3.0 | 3.3.0 | 3.2.0 |
| [rocSOLVER](https://rocm.docs.amd.com/projects/rocSOLVER/en/latest/index.html "(in rocSOLVER Documentation v3.28.0)") | 3.28.0 | 3.28.0 | 3.27.0 |
| [rocSPARSE](https://rocm.docs.amd.com/projects/rocSPARSE/en/latest/index.html "(in rocSPARSE Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 |
| [rocWMMA](https://rocm.docs.amd.com/projects/rocWMMA/en/latest/index.html "(in rocWMMA Documentation v1.7.0)") | 1.7.0 | 1.7.0 | 1.6.0 |
| [Tensile](https://rocm.docs.amd.com/projects/Tensile/en/latest/src/index.html "(in Tensile Documentation v4.43.0)") | 4.43.0 | 4.43.0 | 4.42.0 |
|  |  |  |  |
| PRIMITIVES |  |  |  |
| [hipCUB](https://rocm.docs.amd.com/projects/hipCUB/en/latest/index.html "(in hipCUB Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 |
| [hipTensor](https://rocm.docs.amd.com/projects/hipTensor/en/latest/index.html "(in hipTensor Documentation v1.5.0)") | 1.5.0 | 1.5.0 | 1.4.0 |
| [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/latest/index.html "(in rocPRIM Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 |
| [rocThrust](https://rocm.docs.amd.com/projects/rocThrust/en/latest/index.html "(in rocThrust Documentation v3.3.0)") | 3.3.0 | 3.3.0 | 3.3.0 |
|  |  |  |  |
| SUPPORT LIBS |  |  |  |
| [hipother](https://github.com/ROCm/hipother) | 6.4.43483 | 6.4.43482 | 6.3.42131 |
| [rocm-core](https://github.com/ROCm/rocm-core) | 6.4.1 | 6.4.0 | 6.3.0 |
| [ROCT-Thunk-Interface](https://github.com/ROCm/ROCT-Thunk-Interface) | N/A [[5]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr) | N/A [[5]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr) | N/A [[5]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr) |
|  |  |  |  |
| SYSTEM MGMT TOOLS |  |  |  |
| [AMD SMI](https://rocm.docs.amd.com/projects/amdsmi/en/latest/index.html "(in AMD SMI v25.4.0)") | 25.4.2 | 25.3.0 | 24.7.1 |
| [ROCm Data Center Tool](https://rocm.docs.amd.com/projects/rdc/en/latest/index.html "(in ROCm Data Center Documentation)") | 0.3.0 | 0.3.0 | 0.3.0 |
| [rocminfo](https://rocm.docs.amd.com/projects/rocminfo/en/latest/index.html "(in rocminfo v1.0.0)") | 1.0.0 | 1.0.0 | 1.0.0 |
| [ROCm SMI](https://rocm.docs.amd.com/projects/rocm_smi_lib/en/latest/index.html "(in ROCm SMI LIB Documentation v7.6.0)") | 7.5.0 | 7.5.0 | 7.4.0 |
| [ROCm Validation Suite](https://rocm.docs.amd.com/projects/ROCmValidationSuite/en/latest/index.html "(in RVS Documentation v1.1.0)") | 1.1.0 | 1.1.0 | 1.1.0 |
|  |  |  |  |
| PERFORMANCE TOOLS |  |  |  |
| [ROCm Bandwidth Test](https://rocm.docs.amd.com/projects/rocm_bandwidth_test/en/latest/index.html "(in rocm_bandwidth_test)") | 1.4.0 | 1.4.0 | 1.4.0 |
| [ROCm Compute Profiler](https://rocm.docs.amd.com/projects/rocprofiler-compute/en/latest/index.html "(in ROCm Compute Profiler v3.1.0)") | 3.1.0 | 3.1.0 | 3.0.0 |
| [ROCm Systems Profiler](https://rocm.docs.amd.com/projects/rocprofiler-systems/en/latest/index.html "(in rocprofiler-systems v1.0.1)") | 1.0.1 | 1.0.0 | 0.1.0 |
| [ROCProfiler](https://rocm.docs.amd.com/projects/rocprofiler/en/latest/index.html "(in rocprofiler Documentation v2.0.0)") | 2.0.60401 | 2.0.60400 | 2.0.60300 |
| [ROCprofiler-SDK](https://rocm.docs.amd.com/projects/rocprofiler-sdk/en/latest/index.html "(in Rocprofiler SDK v0.6.0)") | 0.6.0 | 0.6.0 | 0.5.0 |
| [ROCTracer](https://rocm.docs.amd.com/projects/roctracer/en/latest/index.html "(in roctracer Documentation v4.1.0)") | 4.1.60401 | 4.1.60400 | 4.1.60300 |
|  |  |  |  |
| DEVELOPMENT TOOLS |  |  |  |
| [HIPIFY](https://rocm.docs.amd.com/projects/HIPIFY/en/latest/index.html "(in HIPIFY Documentation)") | 19.0.0 | 19.0.0 | 18.0.0.24455 |
| [ROCm CMake](https://rocm.docs.amd.com/projects/ROCmCMakeBuildTools/en/latest/index.html "(in ROCm CMake Build Tools v0.14.0)") | 0.14.0 | 0.14.0 | 0.14.0 |
| [ROCdbgapi](https://rocm.docs.amd.com/projects/ROCdbgapi/en/latest/index.html "(in ROCdbgapi Documentation v0.77.2)") | 0.77.2 | 0.77.2 | 0.77.0 |
| [ROCm Debugger (ROCgdb)](https://rocm.docs.amd.com/projects/ROCgdb/en/latest/index.html "(in ROCgdb Documentation v15.2)") | 15.2.0 | 15.2.0 | 15.2.0 |
| [rocprofiler-register](https://github.com/ROCm/rocprofiler-register) | 0.4.0 | 0.4.0 | 0.4.0 |
| [ROCr Debug Agent](https://rocm.docs.amd.com/projects/rocr_debug_agent/en/latest/index.html "(in rocr_debug_agent v2.0.4)") | 2.0.4 | 2.0.4 | 2.0.3 |
|  |  |  |  |
| COMPILERS |  |  |  |
| [clang-ocl](https://github.com/ROCm/clang-ocl) | N/A | N/A | N/A |
| [hipCC](https://rocm.docs.amd.com/projects/HIPCC/en/latest/index.html "(in HIPCC Documentation v1.1.1)") | 1.1.1 | 1.1.1 | 1.1.1 |
| [Flang](https://github.com/ROCm/flang) | 19.0.0.25184 | 19.0.0.25133 | 18.0.0.24455 |
| [llvm-project](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html "(in llvm-project Documentation v19.0.0)") | 19.0.0.25184 | 19.0.0.25133 | 18.0.0.24491 |
| [OpenMP](https://github.com/ROCm/llvm-project/tree/amd-staging/openmp) | 19.0.0.25184 | 19.0.0.25133 | 18.0.0.24491 |
|  |  |  |  |
| RUNTIMES |  |  |  |
| [AMD CLR](https://rocm.docs.amd.com/projects/HIP/en/latest/understand/amd_clr.html "(in HIP Documentation v6.4.43483)") | 6.4.43483 | 6.4.43482 | 6.3.42131 |
| [HIP](https://rocm.docs.amd.com/projects/HIP/en/latest/index.html "(in HIP Documentation v6.4.43483)") | 6.4.43483 | 6.4.43482 | 6.3.42131 |
| [OpenCL Runtime](https://github.com/ROCm/clr/tree/develop/opencl) | 2.0.0 | 2.0.0 | 2.0.0 |
| [ROCr Runtime](https://rocm.docs.amd.com/projects/ROCR-Runtime/en/latest/index.html "(in ROCR Documentation v1.15.0)") | 1.15.0 | 1.15.0 | 1.14.0 |

Footnotes

Operating systems, kernel and Glibc versions[#](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#operating-systems-kernel-and-glibc-versions "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Use this lookup table to confirm which operating system and kernel versions are supported with ROCm.

| OS | Version | Kernel | Glibc |
| --- | --- | --- | --- |
| [Ubuntu](https://ubuntu.com/about/release-cycle#ubuntu-kernel-release-cycle) | 24.04.2 | 6.8 GA, 6.11 HWE | 2.39 |
|  |  |  |  |
| [Ubuntu](https://ubuntu.com/about/release-cycle#ubuntu-kernel-release-cycle) | 22.04.5 | 5.15 GA, 6.8 HWE | 2.35 |
|  |  |  |  |
| [Red Hat Enterprise Linux (RHEL 9)](https://access.redhat.com/articles/3078#RHEL9) | 9.6 | 5.14+ | 2.34 |
|  | 9.5 | 5.14+ | 2.34 |
|  | 9.4 | 5.14+ | 2.34 |
|  | 9.3 | 5.14+ | 2.34 |
|  |  |  |  |
| [Red Hat Enterprise Linux (RHEL 8)](https://access.redhat.com/articles/3078#RHEL8) | 8.10 | 4.18.0+ | 2.28 |
|  | 8.9 | 4.18.0 | 2.28 |
|  |  |  |  |
| [SUSE Linux Enterprise Server (SLES)](https://www.suse.com/support/kb/doc/?id=000019587#SLE15SP4) | 15 SP6 | 6.5.0+, 6.4.0 | 2.38 |
|  | 15 SP5 | 5.14.21 | 2.31 |
|  |  |  |  |
| [Oracle Linux](https://blogs.oracle.com/scoter/post/oracle-linux-and-unbreakable-enterprise-kernel-uek-releases) | 9 | 5.15.0 (UEK) | 2.35 |
|  | 8 | 5.15.0 (UEK) | 2.28 |
|  |  |  |  |
| [Debian](https://www.debian.org/download) | 12 | 6.1 | 2.36 |
|  |  |  |  |
| [Azure Linux](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/azure-linux-3-0-now-in-preview-on-azure-kubernetes-service-v1-31/4287229) | 3.0 | 6.6.60 | 2.38 |
|  |  |  |  |

Note

*   See [Red Hat Enterprise Linux Release Dates](https://access.redhat.com/articles/3078) to learn about the specific kernel versions supported on Red Hat Enterprise Linux (RHEL).

*   See [List of SUSE Linux Enterprise Server kernel](https://www.suse.com/support/kb/doc/?id=000019587) to learn about the specific kernel version supported on SUSE Linux Enterprise Server (SLES).

Past versions of ROCm compatibility matrix[#](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#past-versions-of-rocm-compatibility-matrix "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Expand for full historical view of:

You can [download the entire .csv](https://rocm.docs.amd.com/en/latest/downloads/compatibility-matrix-historical-6.0.csv) for offline reference.

| ROCm Version | 6.4.1 | 6.4.0 | 6.3.3 | 6.3.2 | 6.3.1 | 6.3.0 | 6.2.4 | 6.2.2 | 6.2.1 | 6.2.0 | 6.1.5 | 6.1.2 | 6.1.1 | 6.1.0 | 6.0.2 | 6.0.0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Operating systems & kernels](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#os-kernel-versions) | Ubuntu 24.04.2 | Ubuntu 24.04.2 | Ubuntu 24.04.2 | Ubuntu 24.04.2 | Ubuntu 24.04.2 | Ubuntu 24.04.2 | Ubuntu 24.04.1, 24.04 | Ubuntu 24.04.1, 24.04 | Ubuntu 24.04.1, 24.04 | Ubuntu 24.04 |  |  |  |  |  |  |
|  | Ubuntu 22.04.5 | Ubuntu 22.04.5 | Ubuntu 22.04.5 | Ubuntu 22.04.5 | Ubuntu 22.04.5 | Ubuntu 22.04.5 | Ubuntu 22.04.5, 22.04.4 | Ubuntu 22.04.5, 22.04.4 | Ubuntu 22.04.5, 22.04.4 | Ubuntu 22.04.5, 22.04.4 | Ubuntu 22.04.5, 22.04.4, 22.04.3 | Ubuntu 22.04.4, 22.04.3 | Ubuntu 22.04.4, 22.04.3 | Ubuntu 22.04.4, 22.04.3 | Ubuntu 22.04.4, 22.04.3, 22.04.2 | Ubuntu 22.04.4, 22.04.3, 22.04.2 |
|  |  |  |  |  |  |  |  |  |  |  | Ubuntu 20.04.6, 20.04.5 | Ubuntu 20.04.6, 20.04.5 | Ubuntu 20.04.6, 20.04.5 | Ubuntu 20.04.6, 20.04.5 | Ubuntu 20.04.6, 20.04.5 | Ubuntu 20.04.6, 20.04.5 |
|  | RHEL 9.6, 9.5, 9.4 | RHEL 9.5, 9.4 | RHEL 9.5, 9.4 | RHEL 9.5, 9.4 | RHEL 9.5, 9.4 | RHEL 9.5, 9.4 | RHEL 9.4, 9.3 | RHEL 9.4, 9.3 | RHEL 9.4, 9.3 | RHEL 9.4, 9.3 | RHEL 9.4, 9.3, 9.2 | RHEL 9.4, 9.3, 9.2 | RHEL 9.4, 9.3, 9.2 | RHEL 9.4, 9.3, 9.2 | RHEL 9.3, 9.2 | RHEL 9.3, 9.2 |
|  | RHEL 8.10 | RHEL 8.10 | RHEL 8.10 | RHEL 8.10 | RHEL 8.10 | RHEL 8.10 | RHEL 8.10, 8.9 | RHEL 8.10, 8.9 | RHEL 8.10, 8.9 | RHEL 8.10, 8.9 | RHEL 8.9, 8.8 | RHEL 8.9, 8.8 | RHEL 8.9, 8.8 | RHEL 8.9, 8.8 | RHEL 8.9, 8.8 | RHEL 8.9, 8.8 |
|  | SLES 15 SP6 | SLES 15 SP6 | SLES 15 SP6, SP5 | SLES 15 SP6, SP5 | SLES 15 SP6, SP5 | SLES 15 SP6, SP5 | SLES 15 SP6, SP5 | SLES 15 SP6, SP5 | SLES 15 SP6, SP5 | SLES 15 SP6, SP5 | SLES 15 SP5, SP4 | SLES 15 SP5, SP4 | SLES 15 SP5, SP4 | SLES 15 SP5, SP4 | SLES 15 SP5, SP4 | SLES 15 SP5, SP4 |
|  |  |  |  |  |  |  |  |  |  |  |  | CentOS 7.9 | CentOS 7.9 | CentOS 7.9 | CentOS 7.9 | CentOS 7.9 |
|  | Oracle Linux 9, 8 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 9, 8 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.10 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.10 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.10 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.10 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.9 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.9 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.9 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.9 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.9 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.9 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Oracle Linux 8.9 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) |  |  |  |
|  | Debian 12 [[8]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#single-node-past-60) | Debian 12 [[8]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#single-node-past-60) | Debian 12 [[8]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#single-node-past-60) | Debian 12 [[8]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#single-node-past-60) | Debian 12 [[8]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#single-node-past-60) |  |  |  |  |  |  |  |  |  |  |  |
|  | Azure Linux 3.0 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Azure Linux 3.0 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Azure Linux 3.0 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) | Azure Linux 3.0 [[7]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300x-past-60) |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [Architecture](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html "(in ROCm installation on Linux v6.4.1)") | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 | CDNA3 |
|  | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 | CDNA2 |
|  | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA | CDNA |
|  | RDNA4 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 | RDNA3 |
|  | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 | RDNA2 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [GPU / LLVM target](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html "(in ROCm installation on Linux v6.4.1)") | gfx1201 [[20]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#rdna-os-past-60) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | gfx1200 [[20]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#rdna-os-past-60) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | gfx1101 [[20]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#rdna-os-past-60) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 | gfx1100 |
|  | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 | gfx1030 |
|  | gfx942 | gfx942 | gfx942 | gfx942 | gfx942 | gfx942 | gfx942 [[9]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-624-past-60) | gfx942 [[10]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-622-past-60) | gfx942 [[11]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-621-past-60) | gfx942 [[12]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-620-past-60) | gfx942 [[13]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-612-past-60) | gfx942 [[13]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-612-past-60) | gfx942 [[14]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-611-past-60) | gfx942 [[15]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-610-past-60) | gfx942 [[16]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-602-past-60) | gfx942 [[17]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#mi300-600-past-60) |
|  | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a | gfx90a |
|  | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 | gfx908 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| FRAMEWORK SUPPORT |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [PyTorch](https://rocm.docs.amd.com/en/latest/compatibility/ml-compatibility/pytorch-compatibility.html) | 2.6, 2.5, 2.4, 2.3 | 2.6, 2.5, 2.4, 2.3 | 2.4, 2.3, 2.2, 1.13 | 2.4, 2.3, 2.2, 1.13 | 2.4, 2.3, 2.2, 1.13 | 2.4, 2.3, 2.2, 2.1, 2.0, 1.13 | 2.3, 2.2, 2.1, 2.0, 1.13 | 2.3, 2.2, 2.1, 2.0, 1.13 | 2.3, 2.2, 2.1, 2.0, 1.13 | 2.3, 2.2, 2.1, 2.0, 1.13 | 2.1, 2.0, 1.13 | 2.1, 2.0, 1.13 | 2.1, 2.0, 1.13 | 2.1, 2.0, 1.13 | 2.1, 2.0, 1.13 | 2.1, 2.0, 1.13 |
| [TensorFlow](https://rocm.docs.amd.com/en/latest/compatibility/ml-compatibility/tensorflow-compatibility.html) | 2.18.1, 2.17.1, 2.16.2 | 2.18.1, 2.17.1, 2.16.2 | 2.17.0, 2.16.2, 2.15.1 | 2.17.0, 2.16.2, 2.15.1 | 2.17.0, 2.16.2, 2.15.1 | 2.17.0, 2.16.2, 2.15.1 | 2.16.1, 2.15.1, 2.14.1 | 2.16.1, 2.15.1, 2.14.1 | 2.16.1, 2.15.1, 2.14.1 | 2.16.1, 2.15.1, 2.14.1 | 2.15.0, 2.14.0, 2.13.1 | 2.15.0, 2.14.0, 2.13.1 | 2.15.0, 2.14.0, 2.13.1 | 2.15.0, 2.14.0, 2.13.1 | 2.14.0, 2.13.1, 2.12.1 | 2.14.0, 2.13.1, 2.12.1 |
| [JAX](https://rocm.docs.amd.com/en/latest/compatibility/ml-compatibility/jax-compatibility.html) | 0.4.35 | 0.4.35 | 0.4.31 | 0.4.31 | 0.4.31 | 0.4.31 | 0.4.26 | 0.4.26 | 0.4.26 | 0.4.26 | 0.4.26 | 0.4.26 | 0.4.26 | 0.4.26 | 0.4.26 | 0.4.26 |
| [ONNX Runtime](https://onnxruntime.ai/docs/build/eps.html#amd-migraphx) | 1.2 | 1.2 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.17.3 | 1.14.1 | 1.14.1 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| THIRD PARTY COMMS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [UCC](https://github.com/ROCm/ucc) | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.3.0 | >=1.2.0 | >=1.2.0 |
| [UCX](https://github.com/ROCm/ucx) | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.15.0 | >=1.14.1 | >=1.14.1 | >=1.14.1 | >=1.14.1 | >=1.14.1 | >=1.14.1 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| THIRD PARTY ALGORITHM |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Thrust | 2.5.0 | 2.5.0 | 2.3.2 | 2.3.2 | 2.3.2 | 2.3.2 | 2.2.0 | 2.2.0 | 2.2.0 | 2.2.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.0.1 | 2.0.1 |
| CUB | 2.5.0 | 2.5.0 | 2.3.2 | 2.3.2 | 2.3.2 | 2.3.2 | 2.2.0 | 2.2.0 | 2.2.0 | 2.2.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.0.1 | 2.0.1 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| KMD & USER SPACE [[18]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#kfd-support-past-60) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [KMD versions](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/user-kernel-space-compat-matrix.html "(in ROCm installation on Linux v6.4.1)") | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x, 5.7.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x, 5.7.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x, 5.7.x | 6.4.x, 6.3.x, 6.2.x, 6.1.x, 6.0.x, 5.7.x | 6.2.x, 6.1.x, 6.0.x, 5.7.x, 5.6.x | 6.2.x, 6.1.x, 6.0.x, 5.7.x, 5.6.x |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| ML & COMPUTER VISION |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [Composable Kernel](https://rocm.docs.amd.com/projects/composable_kernel/en/latest/index.html "(in Composable Kernel Documentation v1.1.0)") | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 |
| [MIGraphX](https://rocm.docs.amd.com/projects/AMDMIGraphX/en/latest/index.html "(in MIGraphX v2.12.0)") | 2.12.0 | 2.12.0 | 2.11.0 | 2.11.0 | 2.11.0 | 2.11.0 | 2.10.0 | 2.10.0 | 2.10.0 | 2.10.0 | 2.9.0 | 2.9.0 | 2.9.0 | 2.9.0 | 2.8.0 | 2.8.0 |
| [MIOpen](https://rocm.docs.amd.com/projects/MIOpen/en/latest/index.html "(in MIOpen Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.2.0 | 3.2.0 | 3.2.0 | 3.2.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.0.0 | 3.0.0 |
| [MIVisionX](https://rocm.docs.amd.com/projects/MIVisionX/en/latest/index.html "(in MIVisionX Documentation v3.2.0)") | 3.2.0 | 3.2.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.0.0 | 3.0.0 | 3.0.0 | 3.0.0 | 2.5.0 | 2.5.0 | 2.5.0 | 2.5.0 | 2.5.0 | 2.5.0 |
| [rocAL](https://rocm.docs.amd.com/projects/rocAL/en/latest/index.html "(in rocAL Documentation v2.2.0)") | 2.2.0 | 2.2.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.0.0 | 2.0.0 | 2.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 |
| [rocDecode](https://rocm.docs.amd.com/projects/rocDecode/en/latest/index.html "(in rocDecode documentation v0.10.0)") | 0.10.0 | 0.10.0 | 0.8.0 | 0.8.0 | 0.8.0 | 0.8.0 | 0.6.0 | 0.6.0 | 0.6.0 | 0.6.0 | 0.6.0 | 0.6.0 | 0.5.0 | 0.5.0 | N/A | N/A |
| [rocJPEG](https://rocm.docs.amd.com/projects/rocJPEG/en/latest/index.html "(in rocJPEG Documentation v0.8.0)") | 0.8.0 | 0.8.0 | 0.6.0 | 0.6.0 | 0.6.0 | 0.6.0 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| [rocPyDecode](https://rocm.docs.amd.com/projects/rocPyDecode/en/latest/index.html "(in rocPyDecode v0.3.1)") | 0.3.1 | 0.3.1 | 0.2.0 | 0.2.0 | 0.2.0 | 0.2.0 | 0.1.0 | 0.1.0 | 0.1.0 | 0.1.0 | N/A | N/A | N/A | N/A | N/A | N/A |
| [RPP](https://rocm.docs.amd.com/projects/rpp/en/latest/index.html "(in RPP documentation v1.9.10)") | 1.9.10 | 1.9.10 | 1.9.1 | 1.9.1 | 1.9.1 | 1.9.1 | 1.8.0 | 1.8.0 | 1.8.0 | 1.8.0 | 1.5.0 | 1.5.0 | 1.5.0 | 1.5.0 | 1.4.0 | 1.4.0 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| COMMUNICATION |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [RCCL](https://rocm.docs.amd.com/projects/rccl/en/latest/index.html "(in RCCL Documentation v2.22.3)") | 2.22.3 | 2.22.3 | 2.21.5 | 2.21.5 | 2.21.5 | 2.21.5 | 2.20.5 | 2.20.5 | 2.20.5 | 2.20.5 | 2.18.6 | 2.18.6 | 2.18.6 | 2.18.6 | 2.18.3 | 2.18.3 |
| [rocSHMEM](https://rocm.docs.amd.com/projects/rocSHMEM/en/latest/index.html "(in rocSHMEM v2.0.0)") | 2.0.0 | 2.0.0 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| MATH LIBS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [half](https://github.com/ROCm/half) | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 | 1.12.0 |
| [hipBLAS](https://rocm.docs.amd.com/projects/hipBLAS/en/latest/index.html "(in hipBLAS Documentation v2.4.0)") | 2.4.0 | 2.4.0 | 2.3.0 | 2.3.0 | 2.3.0 | 2.3.0 | 2.2.0 | 2.2.0 | 2.2.0 | 2.2.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.1.0 | 2.0.0 | 2.0.0 |
| [hipBLASLt](https://rocm.docs.amd.com/projects/hipBLASLt/en/latest/index.html "(in hipBLASLt Documentation v0.12.1)") | 0.12.1 | 0.12.0 | 0.10.0 | 0.10.0 | 0.10.0 | 0.10.0 | 0.8.0 | 0.8.0 | 0.8.0 | 0.8.0 | 0.7.0 | 0.7.0 | 0.7.0 | 0.7.0 | 0.6.0 | 0.6.0 |
| [hipFFT](https://rocm.docs.amd.com/projects/hipFFT/en/latest/index.html "(in hipFFT Documentation v1.0.18)") | 1.0.18 | 1.0.18 | 1.0.17 | 1.0.17 | 1.0.17 | 1.0.17 | 1.0.16 | 1.0.15 | 1.0.15 | 1.0.14 | 1.0.14 | 1.0.14 | 1.0.14 | 1.0.14 | 1.0.13 | 1.0.13 |
| [hipfort](https://rocm.docs.amd.com/projects/hipfort/en/latest/index.html "(in hipfort Documentation v0.6.0)") | 0.6.0 | 0.6.0 | 0.5.1 | 0.5.1 | 0.5.0 | 0.5.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 |
| [hipRAND](https://rocm.docs.amd.com/projects/hipRAND/en/latest/index.html "(in hipRAND Documentation v2.12.0)") | 2.12.0 | 2.12.0 | 2.11.1 | 2.11.1 | 2.11.1 | 2.11.0 | 2.11.1 | 2.11.0 | 2.11.0 | 2.11.0 | 2.10.16 | 2.10.16 | 2.10.16 | 2.10.16 | 2.10.16 | 2.10.16 |
| [hipSOLVER](https://rocm.docs.amd.com/projects/hipSOLVER/en/latest/index.html "(in hipSOLVER Documentation v2.4.0)") | 2.4.0 | 2.4.0 | 2.3.0 | 2.3.0 | 2.3.0 | 2.3.0 | 2.2.0 | 2.2.0 | 2.2.0 | 2.2.0 | 2.1.1 | 2.1.1 | 2.1.1 | 2.1.0 | 2.0.0 | 2.0.0 |
| [hipSPARSE](https://rocm.docs.amd.com/projects/hipSPARSE/en/latest/index.html "(in hipSPARSE Documentation v3.2.0)") | 3.2.0 | 3.2.0 | 3.1.2 | 3.1.2 | 3.1.2 | 3.1.2 | 3.1.1 | 3.1.1 | 3.1.1 | 3.1.1 | 3.0.1 | 3.0.1 | 3.0.1 | 3.0.1 | 3.0.0 | 3.0.0 |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/index.html "(in hipSPARSELt Documentation v0.2.3)") | 0.2.3 | 0.2.3 | 0.2.2 | 0.2.2 | 0.2.2 | 0.2.2 | 0.2.1 | 0.2.1 | 0.2.1 | 0.2.1 | 0.2.0 | 0.2.0 | 0.1.0 | 0.1.0 | 0.1.0 | 0.1.0 |
| [rocALUTION](https://rocm.docs.amd.com/projects/rocALUTION/en/latest/index.html "(in rocALUTION Documentation v3.2.3)") | 3.2.3 | 3.2.2 | 3.2.1 | 3.2.1 | 3.2.1 | 3.2.1 | 3.2.1 | 3.2.0 | 3.2.0 | 3.2.0 | 3.1.1 | 3.1.1 | 3.1.1 | 3.1.1 | 3.0.3 | 3.0.3 |
| [rocBLAS](https://rocm.docs.amd.com/projects/rocBLAS/en/latest/index.html "(in rocBLAS Documentation v4.4.0)") | 4.4.0 | 4.4.0 | 4.3.0 | 4.3.0 | 4.3.0 | 4.3.0 | 4.2.4 | 4.2.1 | 4.2.1 | 4.2.0 | 4.1.2 | 4.1.2 | 4.1.0 | 4.1.0 | 4.0.0 | 4.0.0 |
| [rocFFT](https://rocm.docs.amd.com/projects/rocFFT/en/latest/index.html "(in rocFFT Documentation v1.0.32)") | 1.0.32 | 1.0.32 | 1.0.31 | 1.0.31 | 1.0.31 | 1.0.31 | 1.0.30 | 1.0.29 | 1.0.29 | 1.0.28 | 1.0.27 | 1.0.27 | 1.0.27 | 1.0.26 | 1.0.25 | 1.0.23 |
| [rocRAND](https://rocm.docs.amd.com/projects/rocRAND/en/latest/index.html "(in rocRAND Documentation v3.3.0)") | 3.3.0 | 3.3.0 | 3.2.0 | 3.2.0 | 3.2.0 | 3.2.0 | 3.1.1 | 3.1.0 | 3.1.0 | 3.1.0 | 3.0.1 | 3.0.1 | 3.0.1 | 3.0.1 | 3.0.0 | 2.10.17 |
| [rocSOLVER](https://rocm.docs.amd.com/projects/rocSOLVER/en/latest/index.html "(in rocSOLVER Documentation v3.28.0)") | 3.28.0 | 3.28.0 | 3.27.0 | 3.27.0 | 3.27.0 | 3.27.0 | 3.26.2 | 3.26.0 | 3.26.0 | 3.26.0 | 3.25.0 | 3.25.0 | 3.25.0 | 3.25.0 | 3.24.0 | 3.24.0 |
| [rocSPARSE](https://rocm.docs.amd.com/projects/rocSPARSE/en/latest/index.html "(in rocSPARSE Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.2.1 | 3.2.0 | 3.2.0 | 3.2.0 | 3.1.2 | 3.1.2 | 3.1.2 | 3.1.2 | 3.0.2 | 3.0.2 |
| [rocWMMA](https://rocm.docs.amd.com/projects/rocWMMA/en/latest/index.html "(in rocWMMA Documentation v1.7.0)") | 1.7.0 | 1.7.0 | 1.6.0 | 1.6.0 | 1.6.0 | 1.6.0 | 1.5.0 | 1.5.0 | 1.5.0 | 1.5.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.3.0 | 1.3.0 |
| [Tensile](https://rocm.docs.amd.com/projects/Tensile/en/latest/src/index.html "(in Tensile Documentation v4.43.0)") | 4.43.0 | 4.43.0 | 4.42.0 | 4.42.0 | 4.42.0 | 4.42.0 | 4.41.0 | 4.41.0 | 4.41.0 | 4.41.0 | 4.40.0 | 4.40.0 | 4.40.0 | 4.40.0 | 4.39.0 | 4.39.0 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| PRIMITIVES |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [hipCUB](https://rocm.docs.amd.com/projects/hipCUB/en/latest/index.html "(in hipCUB Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.2.1 | 3.2.0 | 3.2.0 | 3.2.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.0.0 | 3.0.0 |
| [hipTensor](https://rocm.docs.amd.com/projects/hipTensor/en/latest/index.html "(in hipTensor Documentation v1.5.0)") | 1.5.0 | 1.5.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.3.0 | 1.3.0 | 1.3.0 | 1.3.0 | 1.2.0 | 1.2.0 | 1.2.0 | 1.2.0 | 1.1.0 | 1.1.0 |
| [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/latest/index.html "(in rocPRIM Documentation v3.4.0)") | 3.4.0 | 3.4.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.2.2 | 3.2.0 | 3.2.0 | 3.2.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.1.0 | 3.0.0 | 3.0.0 |
| [rocThrust](https://rocm.docs.amd.com/projects/rocThrust/en/latest/index.html "(in rocThrust Documentation v3.3.0)") | 3.3.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.3.0 | 3.1.1 | 3.1.0 | 3.1.0 | 3.0.1 | 3.0.1 | 3.0.1 | 3.0.1 | 3.0.1 | 3.0.0 | 3.0.0 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| SUPPORT LIBS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [hipother](https://github.com/ROCm/hipother) | 6.4.43483 | 6.4.43482 | 6.3.42134 | 6.3.42134 | 6.3.42133 | 6.3.42131 | 6.2.41134 | 6.2.41134 | 6.2.41134 | 6.2.41133 | 6.1.40093 | 6.1.40093 | 6.1.40092 | 6.1.40091 | 6.1.32831 | 6.1.32830 |
| [rocm-core](https://github.com/ROCm/rocm-core) | 6.4.1 | 6.4.0 | 6.3.3 | 6.3.2 | 6.3.1 | 6.3.0 | 6.2.4 | 6.2.2 | 6.2.1 | 6.2.0 | 6.1.5 | 6.1.2 | 6.1.1 | 6.1.0 | 6.0.2 | 6.0.0 |
| [ROCT-Thunk-Interface](https://github.com/ROCm/ROCT-Thunk-Interface) | N/A [[19]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr-past-60) | N/A [[19]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr-past-60) | N/A [[19]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr-past-60) | N/A [[19]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr-past-60) | N/A [[19]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr-past-60) | N/A [[19]](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#roct-rocr-past-60) | 20240607.5.7 | 20240607.5.7 | 20240607.4.05 | 20240607.1.4246 | 20240125.5.08 | 20240125.5.08 | 20240125.5.08 | 20240125.3.30 | 20231016.2.245 | 20231016.2.245 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| SYSTEM MGMT TOOLS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [AMD SMI](https://rocm.docs.amd.com/projects/amdsmi/en/latest/index.html "(in AMD SMI v25.4.0)") | 25.4.2 | 25.3.0 | 24.7.1 | 24.7.1 | 24.7.1 | 24.7.1 | 24.6.3 | 24.6.3 | 24.6.3 | 24.6.2 | 24.5.1 | 24.5.1 | 24.5.1 | 24.4.1 | 23.4.2 | 23.4.2 |
| [ROCm Data Center Tool](https://rocm.docs.amd.com/projects/rdc/en/latest/index.html "(in ROCm Data Center Documentation)") | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 |
| [rocminfo](https://rocm.docs.amd.com/projects/rocminfo/en/latest/index.html "(in rocminfo v1.0.0)") | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 |
| [ROCm SMI](https://rocm.docs.amd.com/projects/rocm_smi_lib/en/latest/index.html "(in ROCm SMI LIB Documentation v7.6.0)") | 7.5.0 | 7.5.0 | 7.4.0 | 7.4.0 | 7.4.0 | 7.4.0 | 7.3.0 | 7.3.0 | 7.3.0 | 7.3.0 | 7.2.0 | 7.2.0 | 7.0.0 | 7.0.0 | 6.0.2 | 6.0.0 |
| [ROCm Validation Suite](https://rocm.docs.amd.com/projects/ROCmValidationSuite/en/latest/index.html "(in RVS Documentation v1.1.0)") | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.1.0 | 1.0.60204 | 1.0.60202 | 1.0.60201 | 1.0.60200 | 1.0.60105 | 1.0.60102 | 1.0.60101 | 1.0.60100 | 1.0.60002 | 1.0.60000 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| PERFORMANCE TOOLS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [ROCm Bandwidth Test](https://rocm.docs.amd.com/projects/rocm_bandwidth_test/en/latest/index.html "(in rocm_bandwidth_test)") | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 | 1.4.0 |
| [ROCm Compute Profiler](https://rocm.docs.amd.com/projects/rocprofiler-compute/en/latest/index.html "(in ROCm Compute Profiler v3.1.0)") | 3.1.0 | 3.1.0 | 3.0.0 | 3.0.0 | 3.0.0 | 3.0.0 | 2.0.1 | 2.0.1 | 2.0.1 | 2.0.1 | N/A | N/A | N/A | N/A | N/A | N/A |
| [ROCm Systems Profiler](https://rocm.docs.amd.com/projects/rocprofiler-systems/en/latest/index.html "(in rocprofiler-systems v1.0.1)") | 1.0.1 | 1.0.0 | 0.1.2 | 0.1.1 | 0.1.0 | 0.1.0 | 1.11.2 | 1.11.2 | 1.11.2 | 1.11.2 | N/A | N/A | N/A | N/A | N/A | N/A |
| [ROCProfiler](https://rocm.docs.amd.com/projects/rocprofiler/en/latest/index.html "(in rocprofiler Documentation v2.0.0)") | 2.0.60401 | 2.0.60400 | 2.0.60303 | 2.0.60302 | 2.0.60301 | 2.0.60300 | 2.0.60204 | 2.0.60202 | 2.0.60201 | 2.0.60200 | 2.0.60105 | 2.0.60102 | 2.0.60101 | 2.0.60100 | 2.0.60002 | 2.0.60000 |
| [ROCprofiler-SDK](https://rocm.docs.amd.com/projects/rocprofiler-sdk/en/latest/index.html "(in Rocprofiler SDK v0.6.0)") | 0.6.0 | 0.6.0 | 0.5.0 | 0.5.0 | 0.5.0 | 0.5.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | N/A | N/A | N/A | N/A | N/A | N/A |
| [ROCTracer](https://rocm.docs.amd.com/projects/roctracer/en/latest/index.html "(in roctracer Documentation v4.1.0)") | 4.1.60401 | 4.1.60400 | 4.1.60303 | 4.1.60302 | 4.1.60301 | 4.1.60300 | 4.1.60204 | 4.1.60202 | 4.1.60201 | 4.1.60200 | 4.1.60105 | 4.1.60102 | 4.1.60101 | 4.1.60100 | 4.1.60002 | 4.1.60000 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| DEVELOPMENT TOOLS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [HIPIFY](https://rocm.docs.amd.com/projects/HIPIFY/en/latest/index.html "(in HIPIFY Documentation)") | 19.0.0 | 19.0.0 | 18.0.0.25012 | 18.0.0.25012 | 18.0.0.24491 | 18.0.0.24455 | 18.0.0.24392 | 18.0.0.24355 | 18.0.0.24355 | 18.0.0.24232 | 17.0.0.24193 | 17.0.0.24193 | 17.0.0.24154 | 17.0.0.24103 | 17.0.0.24012 | 17.0.0.23483 |
| [ROCm CMake](https://rocm.docs.amd.com/projects/ROCmCMakeBuildTools/en/latest/index.html "(in ROCm CMake Build Tools v0.14.0)") | 0.14.0 | 0.14.0 | 0.14.0 | 0.14.0 | 0.14.0 | 0.14.0 | 0.13.0 | 0.13.0 | 0.13.0 | 0.13.0 | 0.12.0 | 0.12.0 | 0.12.0 | 0.12.0 | 0.11.0 | 0.11.0 |
| [ROCdbgapi](https://rocm.docs.amd.com/projects/ROCdbgapi/en/latest/index.html "(in ROCdbgapi Documentation v0.77.2)") | 0.77.2 | 0.77.2 | 0.77.0 | 0.77.0 | 0.77.0 | 0.77.0 | 0.76.0 | 0.76.0 | 0.76.0 | 0.76.0 | 0.71.0 | 0.71.0 | 0.71.0 | 0.71.0 | 0.71.0 | 0.71.0 |
| [ROCm Debugger (ROCgdb)](https://rocm.docs.amd.com/projects/ROCgdb/en/latest/index.html "(in ROCgdb Documentation v15.2)") | 15.2.0 | 15.2.0 | 15.2.0 | 15.2.0 | 15.2.0 | 15.2.0 | 14.2.0 | 14.2.0 | 14.2.0 | 14.2.0 | 14.1.0 | 14.1.0 | 14.1.0 | 14.1.0 | 13.2.0 | 13.2.0 |
| [rocprofiler-register](https://github.com/ROCm/rocprofiler-register) | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.4.0 | 0.3.0 | 0.3.0 | 0.3.0 | 0.3.0 | N/A | N/A |
| [ROCr Debug Agent](https://rocm.docs.amd.com/projects/rocr_debug_agent/en/latest/index.html "(in rocr_debug_agent v2.0.4)") | 2.0.4 | 2.0.4 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 | 2.0.3 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| COMPILERS |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [clang-ocl](https://github.com/ROCm/clang-ocl) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | 0.5.0 | 0.5.0 | 0.5.0 | 0.5.0 | 0.5.0 | 0.5.0 |
| [hipCC](https://rocm.docs.amd.com/projects/HIPCC/en/latest/index.html "(in HIPCC Documentation v1.1.1)") | 1.1.1 | 1.1.1 | 1.1.1 | 1.1.1 | 1.1.1 | 1.1.1 | 1.1.1 | 1.1.1 | 1.1.1 | 1.1.1 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 |
| [Flang](https://github.com/ROCm/flang) | 19.0.0.25184 | 19.0.0.25133 | 18.0.0.25012 | 18.0.0.25012 | 18.0.0.24491 | 18.0.0.24455 | 18.0.0.24392 | 18.0.0.24355 | 18.0.0.24355 | 18.0.0.24232 | 17.0.0.24193 | 17.0.0.24193 | 17.0.0.24154 | 17.0.0.24103 | 17.0.0.24012 | 17.0.0.23483 |
| [llvm-project](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html "(in llvm-project Documentation v19.0.0)") | 19.0.0.25184 | 19.0.0.25133 | 18.0.0.25012 | 18.0.0.25012 | 18.0.0.24491 | 18.0.0.24491 | 18.0.0.24392 | 18.0.0.24355 | 18.0.0.24355 | 18.0.0.24232 | 17.0.0.24193 | 17.0.0.24193 | 17.0.0.24154 | 17.0.0.24103 | 17.0.0.24012 | 17.0.0.23483 |
| [OpenMP](https://github.com/ROCm/llvm-project/tree/amd-staging/openmp) | 19.0.0.25184 | 19.0.0.25133 | 18.0.0.25012 | 18.0.0.25012 | 18.0.0.24491 | 18.0.0.24491 | 18.0.0.24392 | 18.0.0.24355 | 18.0.0.24355 | 18.0.0.24232 | 17.0.0.24193 | 17.0.0.24193 | 17.0.0.24154 | 17.0.0.24103 | 17.0.0.24012 | 17.0.0.23483 |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| RUNTIMES |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| [AMD CLR](https://rocm.docs.amd.com/projects/HIP/en/latest/understand/amd_clr.html "(in HIP Documentation v6.4.43483)") | 6.4.43483 | 6.4.43482 | 6.3.42134 | 6.3.42134 | 6.3.42133 | 6.3.42131 | 6.2.41134 | 6.2.41134 | 6.2.41134 | 6.2.41133 | 6.1.40093 | 6.1.40093 | 6.1.40092 | 6.1.40091 | 6.1.32831 | 6.1.32830 |
| [HIP](https://rocm.docs.amd.com/projects/HIP/en/latest/index.html "(in HIP Documentation v6.4.43483)") | 6.4.43483 | 6.4.43482 | 6.3.42134 | 6.3.42134 | 6.3.42133 | 6.3.42131 | 6.2.41134 | 6.2.41134 | 6.2.41134 | 6.2.41133 | 6.1.40093 | 6.1.40093 | 6.1.40092 | 6.1.40091 | 6.1.32831 | 6.1.32830 |
| [OpenCL Runtime](https://github.com/ROCm/clr/tree/develop/opencl) | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 | 2.0.0 |
| [ROCr Runtime](https://rocm.docs.amd.com/projects/ROCR-Runtime/en/latest/index.html "(in ROCR Documentation v1.15.0)") | 1.15.0 | 1.15.0 | 1.14.0 | 1.14.0 | 1.14.0 | 1.14.0 | 1.14.0 | 1.14.0 | 1.14.0 | 1.13.0 | 1.13.0 | 1.13.0 | 1.13.0 | 1.13.0 | 1.12.0 | 1.12.0 |

Footnotes
