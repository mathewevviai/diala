Title: GPU isolation techniques — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html

Markdown Content:
GPU isolation techniques — ROCm Documentation

===============

[Skip to main content](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#main-content)

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
*   [GPU isolation techniques](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#)
*   [Using CMake](https://rocm.docs.amd.com/en/latest/conceptual/cmake-packages.html)
*   [Inception v3 with PyTorch](https://rocm.docs.amd.com/en/latest/conceptual/ai-pytorch-inception.html)

Reference

*   [ROCm libraries](https://rocm.docs.amd.com/en/latest/reference/api-libraries.html)
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
*   GPU...

GPU isolation techniques
========================

Contents
--------

*   [Environment variables](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#environment-variables)
    *   [`ROCR_VISIBLE_DEVICES`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#rocr-visible-devices)
    *   [`GPU_DEVICE_ORDINAL`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#gpu-device-ordinal)
    *   [`HIP_VISIBLE_DEVICES`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#hip-visible-devices)
    *   [`CUDA_VISIBLE_DEVICES`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#cuda-visible-devices)
    *   [`OMP_DEFAULT_DEVICE`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#omp-default-device)

*   [Docker](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#docker)
*   [GPU passthrough to virtual machines](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#gpu-passthrough-to-virtual-machines)

GPU isolation techniques[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#gpu-isolation-techniques "Link to this heading")
==============================================================================================================================================

2025-04-17

4 min read time

 Applies to Linux and Windows 

Restricting the access of applications to a subset of GPUs, aka isolating GPUs allows users to hide GPU resources from programs. The programs by default will only use the “exposed” GPUs ignoring other (hidden) GPUs in the system.

There are multiple ways to achieve isolation of GPUs in the ROCm software stack, differing in which applications they apply to and the security they provide. This page serves as an overview of the techniques.

Environment variables[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#environment-variables "Link to this heading")
----------------------------------------------------------------------------------------------------------------------------------------

The runtimes in the ROCm software stack read these environment variables to select the exposed or default device to present to applications using them.

Environment variables shouldn’t be used for isolating untrusted applications, as an application can reset them before initializing the runtime.

### `ROCR_VISIBLE_DEVICES`[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#rocr-visible-devices "Link to this heading")

A list of device indices or UUID s that will be exposed to applications.

Runtime : ROCm Software Runtime. Applies to all applications using the user mode ROCm software stack.

Example to expose the 1. device and a device based on UUID.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#id2 "Link to this code")

export ROCR_VISIBLE_DEVICES="0,GPU-DEADBEEFDEADBEEF"

### `GPU_DEVICE_ORDINAL`[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#gpu-device-ordinal "Link to this heading")

Devices indices exposed to OpenCL and HIP applications.

Runtime : ROCm Compute Language Runtime (`ROCclr`). Applies to applications and runtimes using the `ROCclr` abstraction layer including HIP and OpenCL applications.

Example to expose the 1. and 3. device in the system.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#id3 "Link to this code")

export GPU_DEVICE_ORDINAL="0,2"

### `HIP_VISIBLE_DEVICES`[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#hip-visible-devices "Link to this heading")

Device indices exposed to HIP applications.

Runtime: HIP runtime. Applies only to applications using HIP on the AMD platform.

Example to expose the 1. and 3. devices in the system.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#id4 "Link to this code")

export HIP_VISIBLE_DEVICES="0,2"

### `CUDA_VISIBLE_DEVICES`[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#cuda-visible-devices "Link to this heading")

Provided for CUDA compatibility, has the same effect as `HIP_VISIBLE_DEVICES` on the AMD platform.

Runtime : HIP or CUDA Runtime. Applies to HIP applications on the AMD or NVIDIA platform and CUDA applications.

### `OMP_DEFAULT_DEVICE`[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#omp-default-device "Link to this heading")

Default device used for OpenMP target offloading.

Runtime : OpenMP Runtime. Applies only to applications using OpenMP offloading.

Example on setting the default device to the third device.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#id5 "Link to this code")

export OMP_DEFAULT_DEVICE="2"

Docker[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#docker "Link to this heading")
----------------------------------------------------------------------------------------------------------

Docker uses Linux kernel namespaces to provide isolated environments for applications. This isolation applies to most devices by default, including GPUs. To access them in containers explicit access must be granted, please see [Accessing GPUs in containers](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/how-to/docker.html#docker-access-gpus-in-container "(in ROCm installation on Linux v6.4.1)") for details. Specifically refer to [Restricting GPU access](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/how-to/docker.html#docker-restrict-gpus "(in ROCm installation on Linux v6.4.1)") on exposing just a subset of all GPUs.

Docker isolation is more secure than environment variables, and applies to all programs that use the `amdgpu` kernel module interfaces. Even programs that don’t use the ROCm runtime, like graphics applications using OpenGL or Vulkan, can only access the GPUs exposed to the container.

GPU passthrough to virtual machines[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#gpu-passthrough-to-virtual-machines "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------

Virtual machines achieve the highest level of isolation, because even the kernel of the virtual machine is isolated from the host. Devices physically installed in the host system can be passed to the virtual machine using PCIe passthrough. This allows for using the GPU with a different operating systems like a Windows guest from a Linux host.

Setting up PCIe passthrough is specific to the hypervisor used. ROCm officially supports [VMware ESXi](https://www.vmware.com/products/esxi-and-esx.html) for select GPUs.

[previous ROCm Linux Filesystem Hierarchy Standard reorganization](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html "previous page")[next Using CMake](https://rocm.docs.amd.com/en/latest/conceptual/cmake-packages.html "next page")

 Contents 

*   [Environment variables](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#environment-variables)
    *   [`ROCR_VISIBLE_DEVICES`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#rocr-visible-devices)
    *   [`GPU_DEVICE_ORDINAL`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#gpu-device-ordinal)
    *   [`HIP_VISIBLE_DEVICES`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#hip-visible-devices)
    *   [`CUDA_VISIBLE_DEVICES`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#cuda-visible-devices)
    *   [`OMP_DEFAULT_DEVICE`](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#omp-default-device)

*   [Docker](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#docker)
*   [GPU passthrough to virtual machines](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#gpu-passthrough-to-virtual-machines)

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Supply Chain Transparency](https://www.amd.com/content/dam/amd/en/documents/corporate/cr/supply-chain-transparency.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#cookie-settings)

© 2025 Advanced Micro Devices, Inc

Cookie Notice
-------------

This website uses cookies and other tracking technologies to enhance user experience and to analyze performance and traffic on our website. We also share information about your use of our site with our social media, advertising and analytics partners. If a [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/en/latest/conceptual/gpu-isolation.html#cookiesettings) preference is detected it will be honored. Further information is available in our [Cookies Policy](https://www.amd.com/en/legal/cookies.html) and [Privacy Notice](https://www.amd.com/en/legal/privacy.html).

Cookie Settings Accept Cookies

![Image 2: Company Logo](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1f-b60d-748d-a5fd-db95d4430544/logos/522af4e3-8eb6-419a-ab34-33424f162acd/1563d021-9ae8-485d-a534-cc8715c52cbd/a0326644-47a6-416e-b4b4-b49d4fd8257a/AMD-Logo-700x394.png)

Do Not Sell or Share My Personal Data
-------------------------------------

California residents have certain rights with regard to the sale of personal information to third parties. Advanced Micro Devices and our partners use information collected through cookies or in other forms to improve experience on our site and pages, analyze how it is used and provide a more personalized experience. 

 You can choose not to allow certain types of cookies, which may impact your experience of the site and the services we are able to offer. At any point, you can click on the different category headings to find out more and change our default settings according to your preference. 

 You can opt out of the sale of your personal information by clicking ‘Share or Sale Personal Data” and change the default settings. 

 You cannot opt-out of our Strictly Necessary Cookies as they are deployed in order to ensure the proper functioning of our website (such as prompting the cookie banner and remembering your settings, to log into your account, to redirect you when you log out, etc.). For more information about the First and Third Party Cookies used please follow this link. 

[More information](https://www.amd.com/en/legal/cookies.html)

Allow All
### Manage Consent Preferences

#### Strictly Necessary Cookies

Always Active

These are cookies that are technically required for the operation of the Sites. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging into secure areas of the Sites or filling in forms. These cookies store data such as online identifiers (including IP address and device identifiers) along with the information used to operate the Sites. We may estimate your geographic location based on your IP address to help us display the content available in your location and adjust the operation of the Sites.

Cookies Details‎

#### Share Or Sale of Personal Data

- [x] Share Or Sale of Personal Data 

Under the CPRA, you have the right to opt-out of the sale or sharing of your personal information to third parties. These cookies collect information for analytics and to personalize your experience with targeted ads. You may exercise your right to opt out of the sale or sharing of personal information by using this toggle switch. If you opt out we will not be able to offer you personalized ads and will not hand over your personal information to any third parties. Additionally, you may contact our legal department for further clarification about your rights as a California consumer by using this Exercise My Rights link.If you have enabled privacy controls on your browser (such as a plugin), we have to take that as a valid request to opt-out. Therefore we would not be able to track your activity through the web. This may affect our ability to personalize ads according to your preferences.

*   ##### Performance Cookies

- [x] Switch Label label  
These cookies allow us to recognize and count the number of visitors and to see how visitors move around the Sites when they use them. This helps us to understand what areas of the Sites are of interest to you and to improve the way the Sites work, for example, by helping you find what you are looking for easily. We may use third party web analytics providers to help us analyze the use of the Sites, email, and newsletters. These cookies store data such as online identifiers (including IP address and device identifiers), information about your web browser and operating system, website usage activity information (including the frequency of your visits, your actions on the Sites and, if you arrived at any of the Sites from another website, i.e. the URL of that website), and content-related activity (including the email and newsletter content you view and click on).

*   ##### Targeting Cookies

- [x] Switch Label label  
These cookies record online identifiers (including IP address and device identifiers), information about your web browser and operating system, website usage activity information (such as information about your visit to the Sites, the pages you have visited, content you have viewed, and the links you have followed), and content-related activity (including the email and newsletter content you view and click on). The information is used to try to make the Sites, emails, and newsletters, and the advertising displayed on them and other websites more relevant to your interests. For instance, when you visit the Sites, these targeting cookies are used by third party providers for remarketing purposes to allow them to show you advertisements for our products when you visit other websites on the internet. Our third party providers may collect and combine information collected through the Sites, emails, and newsletters with other information about your visits to other websites and apps over time, if those websites and apps also use the same providers.

*   ##### Functionality Cookies

- [x] Switch Label label  
These cookies are used to recognize you when you return to the Sites. This enables us to remember your preferences (for example, your choice of language or region) or when you register on areas of the Sites, such as our web programs or extranets. These cookies store data such as online identifiers (including IP address and device identifiers) along with the information used to provide the function.

Cookies Details‎

### Cookie List

Clear

- [x] checkbox label label

Apply Cancel

Consent Leg.Interest

- [x] checkbox label label

- [x] checkbox label label

- [x] checkbox label label

Reject All Confirm My Choices

[![Image 3: Powered by Onetrust](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1f-b60d-748d-a5fd-db95d4430544/logos/static/powered_by_logo.svg)](https://www.onetrust.com/products/cookie-consent/)
