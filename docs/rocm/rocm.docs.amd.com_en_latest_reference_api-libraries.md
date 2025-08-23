Title: ROCm libraries — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/reference/api-libraries.html

Published Time: Fri, 30 May 2025 19:28:24 GMT

Markdown Content:
ROCm libraries — ROCm Documentation

===============

[Skip to main content](https://rocm.docs.amd.com/en/latest/reference/api-libraries.html#main-content)

Back to top- [x] - [x] 

Ctrl+K

[![Image 1: AMD Logo](https://rocm.docs.amd.com/en/latest/_static/images/amd-header-logo.svg)](https://www.amd.com/)[ROCm™ Software 6.4.1](https://rocm.docs.amd.com/en/latest)[Version List](https://rocm.docs.amd.com/en/latest/release/versions.html)

*   [GitHub](https://github.com/ROCm/ROCm)
*   [Community](https://github.com/ROCm/ROCm/discussions)
*   [Blogs](https://rocm.blogs.amd.com/)
*   [ROCm Developer Hub](https://www.amd.com/en/developer/resources/rocm-hub.html)
*   [Instinct™ Docs](https://instinct.docs.amd.com/)
*   [Infinity Hub](https://www.amd.com/en/developer/resources/infinity-hub.html)
*   [Support](https://github.com/ROCm/ROCm/issues/new/choose)

[ROCm Documentation](https://rocm.docs.amd.com/en/latest/index.html)

Search Ctrl+K

*   [What is ROCm?](https://rocm.docs.amd.com/en/latest/what-is-rocm.html)
*   [Release notes](https://rocm.docs.amd.com/en/latest/about/release-notes.html)
*   [Compatibility matrix](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html)

    *   [Linux system requirements](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html)
    *   [Windows system requirements](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/reference/system-requirements.html)

Install

*   [ROCm on Linux](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/)
*   [HIP SDK on Windows](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/)
*   [ROCm on Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/index.html)
*   [Deep learning frameworks](https://rocm.docs.amd.com/en/latest/how-to/deep-learning-rocm.html)
*   [Build ROCm from source](https://rocm.docs.amd.com/en/latest/how-to/build-rocm.html)

How to

*   [Use ROCm for AI](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/index.html)

    *   [Installation](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/install.html)
    *   [System health benchmarks](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/system-health-check.html)
    *   [Training](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/index.html)

        *   [Train a model with Megatron-LM](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/megatron-lm.html)
        *   [Train a model with PyTorch](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/pytorch-training.html)
        *   [Train a model with JAX MaxText](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/jax-maxtext.html)
        *   [Train a model with LLM Foundry](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html)
        *   [Scale model training](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/scale-model-training.html)

    *   [Fine-tuning LLMs](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/index.html)

        *   [Conceptual overview](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/overview.html)
        *   [Fine-tuning](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/fine-tuning-and-inference.html)

            *   [Use a single accelerator](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html)
            *   [Use multiple accelerators](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/multi-gpu-fine-tuning-and-inference.html)

    *   [Inference](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/index.html)

        *   [Run models from Hugging Face](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html)
        *   [LLM inference frameworks](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html)
        *   [vLLM inference performance testing](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html)
        *   [PyTorch inference performance testing](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/pytorch-inference.html)
        *   [Deploy your model](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/deploy-your-model.html)

    *   [Inference optimization](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/index.html)

        *   [Model quantization techniques](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/model-quantization.html)
        *   [Model acceleration libraries](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/model-acceleration-libraries.html)
        *   [Optimize with Composable Kernel](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/optimizing-with-composable-kernel.html)
        *   [Optimize Triton kernels](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/optimizing-triton-kernel.html)
        *   [Profile and debug](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/profiling-and-debugging.html)
        *   [Workload optimization](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/workload.html)

    *   [AI tutorials](https://rocm.docs.amd.com/projects/ai-developer-hub/en/latest/)

*   [Use ROCm for HPC](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-hpc/index.html)
*   [System optimization](https://rocm.docs.amd.com/en/latest/how-to/system-optimization/index.html)
*   [AMD Instinct MI300X performance guides](https://rocm.docs.amd.com/en/latest/how-to/gpu-performance/mi300x.html)
*   [System debugging](https://rocm.docs.amd.com/en/latest/how-to/system-debugging.html)
*   [Use advanced compiler features](https://rocm.docs.amd.com/en/latest/conceptual/compiler-topics.html)

    *   [ROCm compiler infrastructure](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html)
    *   [Use AddressSanitizer](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/using-gpu-sanitizer.html)
    *   [OpenMP support](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/openmp.html)

*   [Set the number of CUs](https://rocm.docs.amd.com/en/latest/how-to/setting-cus.html)
*   [Troubleshoot BAR access limitation](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html)
*   [ROCm examples](https://github.com/amd/rocm-examples)

Conceptual

*   [GPU architecture overview](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch.html)

    *   [MI300 microarchitecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html)

        *   [AMD Instinct MI300/CDNA3 ISA](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/instruction-set-architectures/amd-instinct-mi300-cdna3-instruction-set-architecture.pdf)
        *   [White paper](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/white-papers/amd-cdna-3-white-paper.pdf)
        *   [MI300 and MI200 Performance counter](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300-mi200-performance-counters.html)

    *   [MI250 microarchitecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html)

        *   [AMD Instinct MI200/CDNA2 ISA](https://www.amd.com/system/files/TechDocs/instinct-mi200-cdna2-instruction-set-architecture.pdf)
        *   [White paper](https://www.amd.com/content/dam/amd/en/documents/instinct-business-docs/white-papers/amd-cdna2-white-paper.pdf)

    *   [MI100 microarchitecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi100.html)

        *   [AMD Instinct MI100/CDNA1 ISA](https://www.amd.com/system/files/TechDocs/instinct-mi100-cdna1-shader-instruction-set-architecture%C2%A0.pdf)
        *   [White paper](https://www.amd.com/content/dam/amd/en/documents/instinct-business-docs/white-papers/amd-cdna-white-paper.pdf)

*   [File structure (Linux FHS)](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html)
*   [GPU isolation techniques](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html)
*   [Using CMake](https://rocm.docs.amd.com/en/latest/conceptual/cmake-packages.html)
*   [Inception v3 with PyTorch](https://rocm.docs.amd.com/en/latest/conceptual/ai-pytorch-inception.html)

Reference

*   [ROCm libraries](https://rocm.docs.amd.com/en/latest/reference/api-libraries.html#)
*   [ROCm tools, compilers, and runtimes](https://rocm.docs.amd.com/en/latest/reference/rocm-tools.html)
*   [Accelerator and GPU hardware specifications](https://rocm.docs.amd.com/en/latest/reference/gpu-arch-specs.html)
*   [Hardware atomics operation support](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html)
*   [Precision support](https://rocm.docs.amd.com/en/latest/reference/precision-support.html)
*   [Graph safe support](https://rocm.docs.amd.com/en/latest/reference/graph-safe-support.html)

Contribute

*   [Contributing to the ROCm documentation](https://rocm.docs.amd.com/en/latest/contribute/contributing.html)

    *   [ROCm documentation toolchain](https://rocm.docs.amd.com/en/latest/contribute/toolchain.html)
    *   [Building documentation](https://rocm.docs.amd.com/en/latest/contribute/building.html)

*   [Providing feedback about the ROCm documentation](https://rocm.docs.amd.com/en/latest/contribute/feedback.html)
*   [ROCm licenses](https://rocm.docs.amd.com/en/latest/about/license.html)

*   [](https://rocm.docs.amd.com/en/latest/index.html)
*   ROCm libraries

ROCm libraries
==============

ROCm libraries[#](https://rocm.docs.amd.com/en/latest/reference/api-libraries.html#rocm-libraries "Link to this heading")
=========================================================================================================================

2025-05-26

2 min read time

 Applies to Linux and Windows 

 Machine Learning and Computer Vision

*   [Composable Kernel](https://rocm.docs.amd.com/projects/composable_kernel/en/latest/index.html "(in Composable Kernel Documentation v1.1.0)")

*   [MIGraphX](https://rocm.docs.amd.com/projects/AMDMIGraphX/en/latest/index.html "(in MIGraphX v2.12.0)")

*   [MIOpen](https://rocm.docs.amd.com/projects/MIOpen/en/latest/index.html "(in MIOpen Documentation v3.4.0)")

*   [MIVisionX](https://rocm.docs.amd.com/projects/MIVisionX/en/latest/index.html "(in MIVisionX Documentation v3.2.0)")

*   [rocAL](https://rocm.docs.amd.com/projects/rocAL/en/latest/index.html "(in rocAL Documentation v2.2.0)")

*   [rocDecode](https://rocm.docs.amd.com/projects/rocDecode/en/latest/index.html "(in rocDecode documentation v0.10.0)")

*   [rocPyDecode](https://rocm.docs.amd.com/projects/rocPyDecode/en/latest/index.html "(in rocPyDecode v0.3.1)")

*   [rocJPEG](https://rocm.docs.amd.com/projects/rocJPEG/en/latest/index.html "(in rocJPEG Documentation v0.8.0)")

*   [ROCm Performance Primitives (RPP)](https://rocm.docs.amd.com/projects/rpp/en/latest/index.html "(in RPP documentation v1.9.10)")

 Primitives

*   [hipCUB](https://rocm.docs.amd.com/projects/hipCUB/en/latest/index.html "(in hipCUB Documentation v3.4.0)")

*   [hipTensor](https://rocm.docs.amd.com/projects/hipTensor/en/latest/index.html "(in hipTensor Documentation v1.5.0)")

*   [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/latest/index.html "(in rocPRIM Documentation v3.4.0)")

*   [rocThrust](https://rocm.docs.amd.com/projects/rocThrust/en/latest/index.html "(in rocThrust Documentation v3.3.0)")

 Communication

*   [RCCL](https://rocm.docs.amd.com/projects/rccl/en/latest/index.html "(in RCCL Documentation v2.22.3)")

*   [rocSHMEM](https://rocm.docs.amd.com/projects/rocSHMEM/en/latest/index.html "(in rocSHMEM v2.0.0)")

 Math

*   [half](https://github.com/ROCm/half)

*   [hipBLAS](https://rocm.docs.amd.com/projects/hipBLAS/en/latest/index.html "(in hipBLAS Documentation v2.4.0)") / [rocBLAS](https://rocm.docs.amd.com/projects/rocBLAS/en/latest/index.html "(in rocBLAS Documentation v4.4.0)")

*   [hipBLASLt](https://rocm.docs.amd.com/projects/hipBLASLt/en/latest/index.html "(in hipBLASLt Documentation v0.12.1)")

*   [hipFFT](https://rocm.docs.amd.com/projects/hipFFT/en/latest/index.html "(in hipFFT Documentation v1.0.18)") / [rocFFT](https://rocm.docs.amd.com/projects/rocFFT/en/latest/index.html "(in rocFFT Documentation v1.0.32)")

*   [hipfort](https://rocm.docs.amd.com/projects/hipfort/en/latest/index.html "(in hipfort Documentation v0.6.0)")

*   [hipRAND](https://rocm.docs.amd.com/projects/hipRAND/en/latest/index.html "(in hipRAND Documentation v2.12.0)") / [rocRAND](https://rocm.docs.amd.com/projects/rocRAND/en/latest/index.html "(in rocRAND Documentation v3.3.0)")

*   [hipSOLVER](https://rocm.docs.amd.com/projects/hipSOLVER/en/latest/index.html "(in hipSOLVER Documentation v2.4.0)") / [rocSOLVER](https://rocm.docs.amd.com/projects/rocSOLVER/en/latest/index.html "(in rocSOLVER Documentation v3.28.0)")

*   [hipSPARSE](https://rocm.docs.amd.com/projects/hipSPARSE/en/latest/index.html "(in hipSPARSE Documentation v3.2.0)") / [rocSPARSE](https://rocm.docs.amd.com/projects/rocSPARSE/en/latest/index.html "(in rocSPARSE Documentation v3.4.0)")

*   [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/index.html "(in hipSPARSELt Documentation v0.2.3)")

*   [rocALUTION](https://rocm.docs.amd.com/projects/rocALUTION/en/latest/index.html "(in rocALUTION Documentation v3.2.3)")

*   [rocWMMA](https://rocm.docs.amd.com/projects/rocWMMA/en/latest/index.html "(in rocWMMA Documentation v1.7.0)")

*   [Tensile](https://rocm.docs.amd.com/projects/Tensile/en/latest/src/index.html "(in Tensile Documentation v4.43.0)")

[previous Deep learning: Inception V3 with PyTorch](https://rocm.docs.amd.com/en/latest/conceptual/ai-pytorch-inception.html "previous page")[next ROCm tools, compilers, and runtimes](https://rocm.docs.amd.com/en/latest/reference/rocm-tools.html "next page")

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Supply Chain Transparency](https://www.amd.com/content/dam/amd/en/documents/corporate/cr/supply-chain-transparency.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Cookie Settings](https://rocm.docs.amd.com/en/latest/reference/api-libraries.html#cookie-settings)

© 2025 Advanced Micro Devices, Inc
