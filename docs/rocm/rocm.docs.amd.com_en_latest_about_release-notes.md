Title: ROCm 6.4.1 release notes — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/about/release-notes.html

Markdown Content:
ROCm 6.4.1 release notes[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-6-4-1-release-notes "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------

2025-05-07

17 min read time

Applies to Linux

The release notes provide a summary of notable changes since the previous ROCm release.

*   [Release highlights](https://rocm.docs.amd.com/en/latest/about/release-notes.html#release-highlights)

*   [Operating system and hardware support changes](https://rocm.docs.amd.com/en/latest/about/release-notes.html#operating-system-and-hardware-support-changes)

*   [ROCm components versioning](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-components)

*   [Detailed component changes](https://rocm.docs.amd.com/en/latest/about/release-notes.html#detailed-component-changes)

*   [ROCm known issues](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-known-issues)

*   [ROCm upcoming changes](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-upcoming-changes)

Note

If you’re using Radeon™ PRO or Radeon GPUs in a workstation setting with a display connected, see the [Use ROCm on Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/compatibility/native_linux/native_linux_compatibility.html) documentation to verify compatibility and system requirements.

Release highlights[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#release-highlights "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------

The following are notable new features and improvements in ROCm 6.4.1. For changes to individual components, see [Detailed component changes](https://rocm.docs.amd.com/en/latest/about/release-notes.html#detailed-component-changes).

### Addition of DPX partition mode under NPS2 memory mode[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#addition-of-dpx-partition-mode-under-nps2-memory-mode "Link to this heading")

AMD Instinct MI300X now supports DPX partition mode under NPS2 memory mode. For more partitioning information, see the [Deep dive into the MI300 compute and memory partition modes](https://rocm.blogs.amd.com/software-tools-optimization/compute-memory-modes/README.html) blog and [AMD Instinct MI300X system optimization](https://instinct.docs.amd.com/projects/amdgpu-docs/en/latest/system-optimization/mi300x.html#change-gpu-partition-modes).

### Introducing the ROCm Data Science toolkit[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#introducing-the-rocm-data-science-toolkit "Link to this heading")

The ROCm Data Science toolkit (or ROCm-DS) is an open-source software collection for high-performance data science applications built on the core ROCm platform. You can leverage ROCm-DS to accelerate both new and existing data science workloads, allowing you to execute intensive applications with larger datasets at lightning speed. ROCm-DS is in an early access state. Running production workloads is not recommended. For more information, see [AMD ROCm-DS Documentation](https://rocm.docs.amd.com/projects/rocm-ds/en/latest/index.html).

### ROCm Offline Installer Creator updates[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-offline-installer-creator-updates "Link to this heading")

The ROCm Offline Installer Creator 6.4.1 now allows you to use the SPACEBAR or ENTER keys for menu item selection in the GUI. It also adds support for Debian 12 and fixes an issue for “full” mode RHEL offline installer creation, where GDM packages were uninstalled during offline installation. See [ROCm Offline Installer Creator](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/install/rocm-offline-installer.html) for more information.

### ROCm Runfile Installer updates[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-runfile-installer-updates "Link to this heading")

The ROCm Runfile Installer 6.4.1 adds the following improvements:

*   Relaxed version checks for installation on different distributions. Provided the dependencies are not installed by the Runfile Installer, you can target installation for a different path from the host system running the installer. For example, the installer can run on a system using Ubuntu 22.04 and install to a partition/system that is using Ubuntu 24.04.

*   Performance improvements for detecting a previous ROCm install.

*   Removal of the extra `opt` directory created for the target during the ROCm installation. For example, installing to `target=/home/amd` now installs ROCm to `/home/amd/rocm-6.4.1` and not `/home/amd/opt/rocm-6.4.1`. For installs using `target=/`, the installation will continue to use `/opt/`.

*   The Runfile Installer can be used to uninstall any Runfile-based installation of the driver.

*   In the CLI interface, the `postrocm` argument can now be run separately from the `rocm` argument. In cases where `postrocm` was missed from the initial ROCm install, `postrocm` can now be run on the same target folder. For example, if you installed ROCm 6.4.1 using `install.run target=/myrocm rocm`, you can run the post-installation separately using the command `install.run target=/myrocm/rocm-6.4.1 postrocm`.

For more information, see [ROCm Runfile Installer](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/install/rocm-runfile-installer.html).

### ROCm documentation updates[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-documentation-updates "Link to this heading")

ROCm documentation continues to be updated to provide clearer and more comprehensive guidance for a wider variety of user needs and use cases.

*   [Tutorials for AI developers](https://rocm.docs.amd.com/projects/ai-developer-hub/en/latest/) have been expanded with five new tutorials. These tutorials are Jupyter notebook-based, easy-to-follow documents. They are ideal for AI developers who want to learn about specific topics, including inference, fine-tuning, and training. For more information about the changes, see [Changelog for the AI Developer Hub](https://rocm.docs.amd.com/projects/ai-developer-hub/en/latest/changelog.html).

*   The [Training a model with LLM Foundry](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html) performance testing guide has been added. This guide describes how to use the preconfigured [ROCm/pytorch-training](https://hub.docker.com/layers/rocm/pytorch-training/v25.5/images/sha256-d47850a9b25b4a7151f796a8d24d55ea17bba545573f0d50d54d3852f96ecde5) training environment and [ROCm/MAD](https://github.com/ROCm/MAD) to test the training performance of the LLM Foundry framework on AMD Instinct MI325X and MI300X accelerators using the [MPT-30B](https://huggingface.co/mosaicml/mpt-30b) model.

*   The [Training a model with PyTorch](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/pytorch-training.html) performance testing guide has been updated to feature the latest [ROCm/pytorch-training](https://hub.docker.com/layers/rocm/pytorch-training/v25.5/images/sha256-d47850a9b25b4a7151f796a8d24d55ea17bba545573f0d50d54d3852f96ecde5) Docker image (a preconfigured training environment with ROCm and PyTorch). Support for [Llama 3.3 70B](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct) has been added.

*   The [Training a model with JAX MaxText](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/jax-maxtext.html) performance testing guide has been updated to feature the latest [ROCm/jax-training](https://hub.docker.com/layers/rocm/jax-training/maxtext-v25.5/images/sha256-4e0516358a227cae8f552fb866ec07e2edcf244756f02e7b40212abfbab5217b) Docker image (a preconfigured training environment with ROCm, JAX, and [MaxText](https://github.com/AI-Hypercomputer/maxtext)). Support for [Llama 3.3 70B](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct) has been added.

*   The [vLLM inference performance testing](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/vllm-benchmark.html?model=pyt_vllm_qwq-32b) guide has been updated to feature the latest [ROCm/vLLM](https://hub.docker.com/layers/rocm/vllm/latest/images/sha256-5c8b4436dd0464119d9df2b44c745fadf81512f18ffb2f4b5dc235c71ebe26b4) Docker image (a preconfigured environment for inference with ROCm and [vLLM](https://docs.vllm.ai/en/latest/)). Support for the [QwQ-32B](https://huggingface.co/Qwen/QwQ-32B) model has been added.

*   The [PyTorch inference performance testing](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/pytorch-inference-benchmark.html?model=pyt_clip_inference) guide has been added, featuring the [ROCm/PyTorch](https://hub.docker.com/layers/rocm/pytorch/latest/images/sha256-ab1d350b818b90123cfda31363019d11c0d41a8f12a19e3cb2cb40cf0261137d) Docker image (a preconfigured inference environment with ROCm and PyTorch) with initial support for the [CLIP](https://huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K) and [Chai-1](https://huggingface.co/chaidiscovery/chai-1) models.

Operating system and hardware support changes[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#operating-system-and-hardware-support-changes "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ROCm 6.4.1 introduces support for the RDNA4 architecture-based [Radeon AI PRO R9700](https://www.amd.com/en/products/graphics/workstations/radeon-ai-pro/ai-9000-series/amd-radeon-ai-pro-r9700.html), [Radeon RX 9070](https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070.html), [Radeon RX 9070 XT](https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070xt.html), Radeon RX 9070 GRE, and [Radeon RX 9060 XT](https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9060xt.html) GPUs for compute workloads. It also adds support for RDNA3 architecture-based [Radeon PRO W7700](https://www.amd.com/en/products/graphics/workstations/radeon-pro/w7700.html) and [Radeon RX 7800 XT](https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7800-xt.html) GPUs. These GPUs are supported on Ubuntu 24.04.2, Ubuntu 22.04.5, RHEL 9.6, RHEL 9.5, and RHEL 9.4. For details, see the full list of [Supported GPUs (Linux)](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#supported-gpus).

See the [Compatibility matrix](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html) for more information about operating system and hardware compatibility.

ROCm components[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-components "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------

The following table lists the versions of ROCm components for ROCm 6.4.1, including any version changes from 6.4.0 to 6.4.1. Click the component’s updated version to go to a list of its changes. Click  to go to the component’s source code on GitHub.

| Category | Group | Name | Version |  |
| --- | --- | --- | --- | --- |
| Libraries | Machine learning and computer vision | [Composable Kernel](https://rocm.docs.amd.com/projects/composable_kernel/en/docs-6.4.1/index.html) | 1.1.0 | [](https://github.com/ROCm/composable_kernel) |
| [MIGraphX](https://rocm.docs.amd.com/projects/AMDMIGraphX/en/docs-6.4.1/index.html) | 2.12.0 | [](https://github.com/ROCm/AMDMIGraphX) |
| [MIOpen](https://rocm.docs.amd.com/projects/MIOpen/en/docs-6.4.1/index.html) | 3.4.0 | [](https://github.com/ROCm/MIOpen) |
| [MIVisionX](https://rocm.docs.amd.com/projects/MIVisionX/en/docs-6.4.1/index.html) | 3.2.0 | [](https://github.com/ROCm/MIVisionX) |
| [rocAL](https://rocm.docs.amd.com/projects/rocAL/en/docs-6.4.1/index.html) | 2.2.0 | [](https://github.com/ROCm/rocAL) |
| [rocDecode](https://rocm.docs.amd.com/projects/rocDecode/en/docs-6.4.1/index.html) | 0.10.0 | [](https://github.com/ROCm/rocDecode) |
| [rocJPEG](https://rocm.docs.amd.com/projects/rocJPEG/en/docs-6.4.1/index.html) | 0.8.0 | [](https://github.com/ROCm/rocJPEG) |
| [rocPyDecode](https://rocm.docs.amd.com/projects/rocPyDecode/en/docs-6.4.1/index.html) | 0.3.1 | [](https://github.com/ROCm/rocPyDecode) |
| [RPP](https://rocm.docs.amd.com/projects/rpp/en/docs-6.4.1/index.html) | 1.9.10 | [](https://github.com/ROCm/rpp) |
|  | Communication | [RCCL](https://rocm.docs.amd.com/projects/rccl/en/docs-6.4.1/index.html) | 2.22.3⇒[2.22.3](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rccl-2-22-3) | [](https://github.com/ROCm/rccl) |
| [rocSHMEM](https://rocm.docs.amd.com/projects/rocSHMEM/en/docs-6.4.1/index.html) | 2.0.0 | [](https://github.com/ROCm/rocSHMEM) |
|  | Math | [hipBLAS](https://rocm.docs.amd.com/projects/hipBLAS/en/docs-6.4.1/index.html) | 2.4.0 | [](https://github.com/ROCm/hipBLAS) |
| [hipBLASLt](https://rocm.docs.amd.com/projects/hipBLASLt/en/docs-6.4.1/index.html) | 0.12.0⇒[0.12.1](https://rocm.docs.amd.com/en/latest/about/release-notes.html#hipblaslt-0-12-1) | [](https://github.com/ROCm/hipBLASLt) |
| [hipFFT](https://rocm.docs.amd.com/projects/hipFFT/en/docs-6.4.1/index.html) | 1.0.18 | [](https://github.com/ROCm/hipFFT) |
| [hipfort](https://rocm.docs.amd.com/projects/hipfort/en/docs-6.4.1/index.html) | 0.6.0 | [](https://github.com/ROCm/hipfort) |
| [hipRAND](https://rocm.docs.amd.com/projects/hipRAND/en/docs-6.4.1/index.html) | 2.12.0 | [](https://github.com/ROCm/hipRAND) |
| [hipSOLVER](https://rocm.docs.amd.com/projects/hipSOLVER/en/docs-6.4.1/index.html) | 2.4.0 | [](https://github.com/ROCm/hipSOLVER) |
| [hipSPARSE](https://rocm.docs.amd.com/projects/hipSPARSE/en/docs-6.4.1/index.html) | 3.2.0 | [](https://github.com/ROCm/hipSPARSE) |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/docs-6.4.1/index.html) | 0.2.3 | [](https://github.com/ROCm/hipSPARSELt) |
| [rocALUTION](https://rocm.docs.amd.com/projects/rocALUTION/en/docs-6.4.1/index.html) | 3.2.2⇒[3.2.3](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocalution-3-2-3) | [](https://github.com/ROCm/rocALUTION) |
| [rocBLAS](https://rocm.docs.amd.com/projects/rocBLAS/en/docs-6.4.1/index.html) | 4.4.0 | [](https://github.com/ROCm/rocBLAS) |
| [rocFFT](https://rocm.docs.amd.com/projects/rocFFT/en/docs-6.4.1/index.html) | 1.0.32 | [](https://github.com/ROCm/rocFFT) |
| [rocRAND](https://rocm.docs.amd.com/projects/rocRAND/en/docs-6.4.1/index.html) | 3.3.0 | [](https://github.com/ROCm/rocRAND) |
| [rocSOLVER](https://rocm.docs.amd.com/projects/rocSOLVER/en/docs-6.4.1/index.html) | 3.28.0 | [](https://github.com/ROCm/rocSOLVER) |
| [rocSPARSE](https://rocm.docs.amd.com/projects/rocSPARSE/en/docs-6.4.1/index.html) | 3.4.0 | [](https://github.com/ROCm/rocSPARSE) |
| [rocWMMA](https://rocm.docs.amd.com/projects/rocWMMA/en/docs-6.4.1/index.html) | 1.7.0 | [](https://github.com/ROCm/rocWMMA) |
| [Tensile](https://rocm.docs.amd.com/projects/Tensile/en/docs-6.4.1/src/index.html) | 4.43.0 | [](https://github.com/ROCm/Tensile) |
|  | Primitives | [hipCUB](https://rocm.docs.amd.com/projects/hipCUB/en/docs-6.4.1/index.html) | 3.4.0 | [](https://github.com/ROCm/hipCUB) |
| [hipTensor](https://rocm.docs.amd.com/projects/hipTensor/en/docs-6.4.1/index.html) | 1.5.0 | [](https://github.com/ROCm/hipTensor) |
| [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/docs-6.4.1/index.html) | 3.4.0 | [](https://github.com/ROCm/rocPRIM) |
| [rocThrust](https://rocm.docs.amd.com/projects/rocThrust/en/docs-6.4.1/index.html) | 3.3.0 | [](https://github.com/ROCm/rocThrust) |
| Tools | System management | [AMD SMI](https://rocm.docs.amd.com/projects/amdsmi/en/docs-6.4.1/index.html) | 25.3.0⇒[25.4.2](https://rocm.docs.amd.com/en/latest/about/release-notes.html#amd-smi-25-4-2) | [](https://github.com/ROCm/amdsmi) |
| [ROCm Data Center Tool](https://rocm.docs.amd.com/projects/rdc/en/docs-6.4.1/index.html) | 0.3.0⇒[0.3.0](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-data-center-tool-0-3-0) | [](https://github.com/ROCm/rdc) |
| [rocminfo](https://rocm.docs.amd.com/projects/rocminfo/en/docs-6.4.1/index.html) | 1.0.0 | [](https://github.com/ROCm/rocminfo) |
| [ROCm SMI](https://rocm.docs.amd.com/projects/rocm_smi_lib/en/docs-6.4.1/index.html) | 7.5.0⇒[7.5.0](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-smi-7-5-0) | [](https://github.com/ROCm/rocm_smi_lib) |
| [ROCmValidationSuite](https://rocm.docs.amd.com/projects/ROCmValidationSuite/en/docs-6.4.1/index.html) | 1.1.0 | [](https://github.com/ROCm/ROCmValidationSuite) |
|  | Performance | [ROCm Bandwidth Test](https://rocm.docs.amd.com/projects/rocm_bandwidth_test/en/docs-6.4.1/index.html) | 1.4.0 | [](https://github.com/ROCm/rocm_bandwidth_test/) |
| [ROCm Compute Profiler](https://rocm.docs.amd.com/projects/rocprofiler-compute/en/docs-6.4.1/index.html) | 3.1.0 | [](https://github.com/ROCm/rocprofiler-compute) |
| [ROCm Systems Profiler](https://rocm.docs.amd.com/projects/rocprofiler-systems/en/docs-6.4.1/index.html) | 1.0.0⇒[1.0.1](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-systems-profiler-1-0-1) | [](https://github.com/ROCm/rocprofiler-systems) |
| [ROCProfiler](https://rocm.docs.amd.com/projects/rocprofiler/en/docs-6.4.1/index.html) | 2.0.0 | [](https://github.com/ROCm/ROCProfiler/) |
| [ROCprofiler-SDK](https://rocm.docs.amd.com/projects/rocprofiler-sdk/en/docs-6.4.1/index.html) | 0.6.0 | [](https://github.com/ROCm/rocprofiler-sdk/) |
| [ROCTracer](https://rocm.docs.amd.com/projects/roctracer/en/docs-6.4.1/index.html) | 4.1.0 | [](https://github.com/ROCm/ROCTracer/) |
|  | Development | [HIPIFY](https://rocm.docs.amd.com/projects/HIPIFY/en/docs-6.4.1/index.html) | 19.0.0 | [](https://github.com/ROCm/HIPIFY/) |
| [ROCdbgapi](https://rocm.docs.amd.com/projects/ROCdbgapi/en/docs-6.4.1/index.html) | 0.77.2 | [](https://github.com/ROCm/ROCdbgapi/) |
| [ROCm CMake](https://rocm.docs.amd.com/projects/ROCmCMakeBuildTools/en/docs-6.4.1/index.html) | 0.14.0 | [](https://github.com/ROCm/rocm-cmake/) |
| [ROCm Debugger (ROCgdb)](https://rocm.docs.amd.com/projects/ROCgdb/en/docs-6.4.1/index.html) | 15.2 | [](https://github.com/ROCm/ROCgdb/) |
| [ROCr Debug Agent](https://rocm.docs.amd.com/projects/rocr_debug_agent/en/docs-6.4.1/index.html) | 2.0.4 | [](https://github.com/ROCm/rocr_debug_agent/) |
| Compilers | [HIPCC](https://rocm.docs.amd.com/projects/HIPCC/en/docs-6.4.1/index.html) | 1.1.1 | [](https://github.com/ROCm/llvm-project/tree/amd-staging/amd/hipcc) |
| [llvm-project](https://rocm.docs.amd.com/projects/llvm-project/en/docs-6.4.1/index.html) | 19.0.0 | [](https://github.com/ROCm/llvm-project/) |
| Runtimes | [HIP](https://rocm.docs.amd.com/projects/HIP/en/docs-6.4.1/index.html) | 6.4.0⇒[6.4.1](https://rocm.docs.amd.com/en/latest/about/release-notes.html#hip-6-4-1) | [](https://github.com/ROCm/HIP/) |
| [ROCr Runtime](https://rocm.docs.amd.com/projects/ROCR-Runtime/en/docs-6.4.1/index.html) | 1.15.0⇒[1.15.0](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocr-runtime-1-15-0) | [](https://github.com/ROCm/ROCR-Runtime/) |

Detailed component changes[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#detailed-component-changes "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------

The following sections describe key changes to ROCm components.

### **AMD SMI** (25.4.2)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#amd-smi-25-4-2 "Link to this heading")

#### Added[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#added "Link to this heading")

*   Dumping CPER entries from RAS tool `amdsmi_get_gpu_cper_entries()` to Python and C APIs.

    *   Dumping CPER entries consist of `amdsmi_cper_hdr_t`.

    *   Dumping CPER entries is also enabled in the CLI interface through `sudo amd-smi ras --cper`.

*   `amdsmi_get_gpu_busy_percent` to the C API.

#### Changed[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#changed "Link to this heading")

*   Modified VRAM display for amd-smi monitor -v.

#### Optimized[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#optimized "Link to this heading")

*   Improved load times for CLI commands when the GPU has multiple parititons.

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#resolved-issues "Link to this heading")

*   Fixed partition enumeration in `amd-smi list -e`, `amdsmi_get_gpu_enumeration_info()`, `amdsmi_enumeration_info_t`, `drm_card`, and `drm_render` fields.

#### Known issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#known-issues "Link to this heading")

*   When using the `--follow` flag with `amd-smi ras --cper`, CPER entries are not streamed continuously as intended. This will be fixed in an upcoming ROCm release.

Note

See the full [AMD SMI changelog](https://github.com/ROCm/amdsmi/blob/release/rocm-rel-6.4/CHANGELOG.md) for details, examples, and in-depth descriptions.

### **HIP** (6.4.1)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#hip-6-4-1 "Link to this heading")

#### Added[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id1 "Link to this heading")

*   New log mask enumeration `LOG_COMGR` enables logging precise code object information.

#### Changed[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id2 "Link to this heading")

*   HIP runtime uses device bitcode before SPIRV.

*   The implementation of preventing `hipLaunchKernel` latency degradation with number of idle streams is reverted/disabled by default.

#### Optimized[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id3 "Link to this heading")

*   Improved kernel logging includes de-mangling shader names.

*   Refined implementation in HIP APIs `hipEventRecords` and `hipStreamWaitEvent` for performance improvement.

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id4 "Link to this heading")

*   Stale state during the graph capture. The return error was fixed, HIP runtime now always uses the latest dependent nodes during `hipEventRecord` capture.

*   Segmentation fault during kernel execution. HIP runtime now allows maximum stack size as per ISA on the GPU device.

### **hipBLASLt** (0.12.1)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#hipblaslt-0-12-1 "Link to this heading")

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id5 "Link to this heading")

*   Fixed an accuracy issue for some solutions using an `FP32` or `TF32` data type with a TT transpose.

### **RCCL** (2.22.3)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rccl-2-22-3 "Link to this heading")

#### Changed[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id6 "Link to this heading")

*   MSCCL++ is now disabled by default. To enable it, set `RCCL_MSCCLPP_ENABLE=1`.

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id7 "Link to this heading")

*   Fixed an issue where early termination, in rare circumstances, could cause the application to stop responding by adding synchronization before destroying a proxy thread.

*   Fixed the accuracy issue for the MSCCLPP `allreduce7` kernel in graph mode.

#### Known issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id8 "Link to this heading")

*   When splitting a communicator using `ncclCommSplit` in some GPU configurations, MSCCL initialization can cause a segmentation fault. The recommended workaround is to disable MSCCL with `export RCCL_MSCCL_ENABLE=0`. This issue will be fixed in a future ROCm release.

*   Within the RCCL-UnitTests test suite, failures occur in tests ending with the `.ManagedMem` and `.ManagedMemGraph` suffixes. These failures only affect the test results and do not affect the RCCL component itself. This issue will be resolved in a future ROCm release.

### **rocALUTION** (3.2.3)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocalution-3-2-3 "Link to this heading")

#### Added[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id9 "Link to this heading")

*   The `-a` option has been added to the `rmake.py` build script. This option allows you to select specific architectures when building on Microsoft Windows.

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id10 "Link to this heading")

*   Fixed an issue where the `HIP_PATH` environment variable was being ignored when compiling on Microsoft Windows.

### **ROCm Data Center Tool** (0.3.0)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-data-center-tool-0-3-0 "Link to this heading")

#### Added[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id11 "Link to this heading")

*   Support for GPU partitions.

*   `RDC_FI_GPU_BUSY_PERCENT` metric.

#### Changed[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id12 "Link to this heading")

*   Updated `rdc_field` to align with `rdc_bootstrap` for current metrics.

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id13 "Link to this heading")

*   Fixed [ROCProfiler](https://rocm.docs.amd.com/projects/rocprofiler/en/docs-6.4.0/index.html) eval metrics and memory leaks.

### **ROCm SMI** (7.5.0)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-smi-7-5-0 "Link to this heading")

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id14 "Link to this heading")

*   Fixed partition enumeration. It now refers to the correct DRM Render and Card paths.

### **ROCm Systems Profiler** (1.0.1)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-systems-profiler-1-0-1 "Link to this heading")

#### Added[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id15 "Link to this heading")

*   How-to document for [network performance profiling](https://rocm.docs.amd.com/projects/rocprofiler-systems/en/latest/how-to/nic-profiling.html) for standard Network Interface Cards (NICs).

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id16 "Link to this heading")

*   Fixed a build issue with Dyninst on GCC 13.

### **ROCr Runtime** (1.15.0)[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocr-runtime-1-15-0 "Link to this heading")

#### Resolved issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#id17 "Link to this heading")

*   Fixed a rare occurrence issue on AMD Instinct MI25, MI50, and MI100 GPUs, where the `SDMA` copies might start before the dependent Kernel finishes and could cause memory corruption.

ROCm known issues[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-known-issues "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------

ROCm known issues are noted on [GitHub](https://github.com/ROCm/ROCm/labels/Verified%20Issue). For known issues related to individual components, review the [Detailed component changes](https://rocm.docs.amd.com/en/latest/about/release-notes.html#detailed-component-changes).

### Radeon AI PRO R9700 hangs when running Stable Diffusion 2.1 at batch sizes above four[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#radeon-ai-pro-r9700-hangs-when-running-stable-diffusion-2-1-at-batch-sizes-above-four "Link to this heading")

Radeon AI PRO R9700 GPUs might hang when running [Stable Diffusion 2.1](https://huggingface.co/stabilityai/stable-diffusion-2-1) with batch sizes greater than four. As a workaround, limit batch sizes to four or fewer. This issue will be addressed in a future ROCm release. See [issue #4770](https://github.com/ROCm/ROCm/issues/4770) on GitHub.

### RCCL MSCCL initialization failure[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rccl-msccl-initialization-failure "Link to this heading")

When splitting a communicator using `ncclCommSplit` in some GPU configurations, MSCCL initialization can cause a segmentation fault. The recommended workaround is to disable MSCCL with `export RCCL_MSCCL_ENABLE=0`. This issue will be fixed in a future ROCm release. See [issue #4769](https://github.com/ROCm/ROCm/issues/4769) on GitHub.

### AMD SMI CLI: CPER entries not dumped continuously when using follow flag[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#amd-smi-cli-cper-entries-not-dumped-continuously-when-using-follow-flag "Link to this heading")

*   When using the `--follow` flag with `amd-smi ras --cper`, CPER entries are not streamed continuously as intended. This will be fixed in an upcoming ROCm release. See [issue #4768](https://github.com/ROCm/ROCm/issues/4768) on GitHub.

### ROCm SMI uninstallation issue on RHEL and SLES[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-smi-uninstallation-issue-on-rhel-and-sles "Link to this heading")

`rocm-smi-lib` does not get uninstalled and remains orphaned on RHEL and SLES systems when:

*   [Uninstalling ROCm using the AMDGPU installer](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/install/amdgpu-install.html#uninstalling-rocm) with `amdgpu-install --uninstall`

*   [Uninstalling via package manager](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/install/install-methods/package-manager/package-manager-rhel.html#uninstall-rocm-packages) with `dnf remove rocm-core` on RHEL or `zypper remove rocm-core` on SLES.

As a workaround, manually remove the `rocm-smi-lib` package using `sudo dnf remove rocm-smi-lib` or `sudo zypper remove rocm-smi-lib`. See [issue #4767](https://github.com/ROCm/ROCm/issues/4767) on GitHub.

ROCm upcoming changes[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-upcoming-changes "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------

The following changes to the ROCm software stack are anticipated for future releases.

### ROCm SMI deprecation[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#rocm-smi-deprecation "Link to this heading")

[ROCm SMI](https://github.com/ROCm/rocm_smi_lib) will be phased out in an upcoming ROCm release and will enter maintenance mode. After this transition, only critical bug fixes will be addressed and no further feature development will take place.

It’s strongly recommended to transition your projects to [AMD SMI](https://github.com/ROCm/amdsmi), the successor to ROCm SMI. AMD SMI includes all the features of the ROCm SMI and will continue to receive regular updates, new functionality, and ongoing support. For more information on AMD SMI, see the [AMD SMI documentation](https://rocm.docs.amd.com/projects/amdsmi/en/latest/).

### ROCTracer, ROCProfiler, rocprof, and rocprofv2 deprecation[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#roctracer-rocprofiler-rocprof-and-rocprofv2-deprecation "Link to this heading")

Development and support for ROCTracer, ROCProfiler, `rocprof`, and `rocprofv2` are being phased out in favor of ROCprofiler-SDK in upcoming ROCm releases. Starting with ROCm 6.4, only critical defect fixes will be addressed for older versions of the profiling tools and libraries. All users are encouraged to upgrade to the latest version of the ROCprofiler-SDK library and the (`rocprofv3`) tool to ensure continued support and access to new features. ROCprofiler-SDK is still in beta today and will be production-ready in a future ROCm release.

It’s anticipated that ROCTracer, ROCProfiler, `rocprof`, and `rocprofv2` will reach end-of-life by future releases, aligning with Q1 of 2026.

### AMDGPU wavefront size compiler macro deprecation[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#amdgpu-wavefront-size-compiler-macro-deprecation "Link to this heading")

Access to the wavefront size as a compile-time constant via the `__AMDGCN_WAVEFRONT_SIZE` and `__AMDGCN_WAVEFRONT_SIZE__` macros or the `constexpr warpSize` variable is deprecated and will be disabled in a future release.

*   The `__AMDGCN_WAVEFRONT_SIZE__` macro and `__AMDGCN_WAVEFRONT_SIZE` alias will be removed in an upcoming release. It is recommended to remove any use of this macro. For more information, see [AMDGPU support](https://rocm.docs.amd.com/projects/llvm-project/en/docs-6.4.0/LLVM/clang/html/AMDGPUSupport.html).

*   `warpSize` will only be available as a non-`constexpr` variable. Where required, the wavefront size should be queried via the `warpSize` variable in device code, or via `hipGetDeviceProperties` in host code. Neither of these will result in a compile-time constant.

*   For cases where compile-time evaluation of the wavefront size cannot be avoided, uses of `__AMDGCN_WAVEFRONT_SIZE`, `__AMDGCN_WAVEFRONT_SIZE__`, or `warpSize` can be replaced with a user-defined macro or `constexpr` variable with the wavefront size(s) for the target hardware. For example:

   #if defined(__GFX9__)
   #define MY_MACRO_FOR_WAVEFRONT_SIZE 64
   #else
   #define MY_MACRO_FOR_WAVEFRONT_SIZE 32
   #endif

### HIPCC Perl scripts deprecation[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#hipcc-perl-scripts-deprecation "Link to this heading")

The HIPCC Perl scripts (`hipcc.pl` and `hipconfig.pl`) will be removed in an upcoming release.

### Changes to ROCm Object Tooling[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#changes-to-rocm-object-tooling "Link to this heading")

ROCm Object Tooling tools `roc-obj-ls`, `roc-obj-extract`, and `roc-obj` are deprecated in ROCm 6.4, and will be removed in a future release. Functionality has been added to the `llvm-objdump --offloading` tool option to extract all clang-offload-bundles into individual code objects found within the objects or executables passed as input. The `llvm-objdump --offloading` tool option also supports the `--arch-name` option, and only extracts code objects found with the specified target architecture. See [llvm-objdump](https://llvm.org/docs/CommandGuide/llvm-objdump.html) for more information.

### HIP runtime API changes[#](https://rocm.docs.amd.com/en/latest/about/release-notes.html#hip-runtime-api-changes "Link to this heading")

There are a number of upcoming changes planned for HIP runtime API in an upcoming major release that are not backward compatible with prior releases. Most of these changes increase alignment between HIP and CUDA APIs or behavior. Some of the upcoming changes are to clean up header files, remove namespace collision, and have a clear separation between `hipRTC` and HIP runtime. For more information, see [HIP 7.0 Is Coming: What You Need to Know to Stay Ahead](https://rocm.blogs.amd.com/ecosystems-and-partners/transition-to-hip-7.0:-guidance-on-upcoming-compatibility-changes/README.html).
