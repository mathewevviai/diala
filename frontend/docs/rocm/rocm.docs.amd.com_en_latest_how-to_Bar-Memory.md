Title: Troubleshoot BAR access limitation — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html

Markdown Content:
Troubleshoot BAR access limitation — ROCm Documentation

===============

[Skip to main content](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#main-content)

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
*   [Troubleshoot BAR access limitation](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#)
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
*   Troubleshoot...

Troubleshoot BAR access limitation
==================================

Contents
--------

*   [Handling physical address limitation](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#handling-physical-address-limitation)
*   [BAR configuration for AMD GPUs](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#bar-configuration-for-amd-gpus)
    *   [Example of BAR usage on AMD GPUs](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#example-of-bar-usage-on-amd-gpus)

Troubleshoot BAR access limitation[#](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#troubleshoot-bar-access-limitation "Link to this heading")
===========================================================================================================================================================

2025-04-17

7 min read time

 Applies to Linux and Windows 

Direct Memory Access (DMA) to PCIe devices using Base Address Registers (BARs) can be restricted due to physical addressing limits. These restrictions can result in data access failures between the system components. Peer-to-peer (P2P) DMA is used to access resources such as registers and memory between devices. PCIe devices need memory-mapped input/output (MMIO) space for DMA, and these MMIO spaces are defined in the PCIe BARs.

These BARs are a set of 32-bit or 64-bit registers that are used to define the resources that PCIe devices provide. The CPU and other system devices also use these to access the resources of the PCIe devices. P2P DMA only works when one device can directly access the local BAR memory of another. If the memory address of a BAR memory exceeds the physical addressing limit of a device, the device will not be able to access that BAR. This could be the device’s own BAR or the BAR of another device in the system.

If the BAR memory exceeds than the physical addressing limit of the device, the device will not be able to access the remote BAR.

To handle any BAR access issues that might occur, you need to be aware of the physical address limitations of the devices and understand the [BAR configuration of AMD GPUs](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#bar-configuration). This information is important when setting up additional MMIO apertures for PCIe devices in the system’s physical address space.

Handling physical address limitation[#](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#handling-physical-address-limitation "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------

When a system boots, the system BIOS allocates the physical address space for the components in the system, including system memory and MMIO apertures. On modern 64-bit platforms, there are generally two or more MMIO apertures: one located below 4 GB of physical address space for 32-bit compatibility, and one or more above 4 GB for devices needing more space.

You can control the memory address of the high MMIO aperture from the system BIOS configuration options. This lets you configure the additional MMIO space to align with the physical addressing limit and allows P2P DMA between the devices. For example, if a PCIe device is limited to 44-bit of physical addressing, you should ensure that the MMIO aperture is set below 44-bit in the system physical address space.

There are two ways to handle this:

*   Ensure that the high MMIO aperture is within the physical addressing limits of the devices in the system. For example, if the devices have a 44-bit physical addressing limit, set the `MMIO High Base` and `MMIO High size` options in the BIOS such that the aperture is within the 44-bit address range, and ensure that the `Above 4G Decoding` option is Enabled.

*   Enable the Input-Output Memory Management Unit (IOMMU). When the IOMMU is enabled in non-passthrough mode, it will create a virtual I/O address space for each device on the system. It also ensures that all virtual addresses created in that space are within the physical addressing limits of the device. For more information on IOMMU, see [Input-Output Memory Management Unit (IOMMU)](https://instinct.docs.amd.com/projects/amdgpu-docs/en/latest/conceptual/iommu.html).

BAR configuration for AMD GPUs[#](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#bar-configuration-for-amd-gpus "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------

The following table shows how the BARs are configured for AMD GPUs.

| BAR Type | Value | Description |
| --- | --- | --- |
| BAR0-1 registers | 64-bit, Prefetchable, GPU memory | 8 GB or 16 GB depending on GPU. Set to less than 2^44 to support P2P access from other GPUs with a 44-bit physical address limit. Prefetchable memory enables faster read operation for high-performance computing (HPC) by fetching the contiguous data from the same data source even before requested as an anticipation of a future request. |
| BAR2-3 registers | 64-bit, Prefetchable, Doorbell | Set to less than 2^44 to support P2P access from other GPUs with a 44-bit physical address limit. As a Doorbell BAR, it indicates to the GPU that a new operation is in its queue to be processed. |
| BAR4 register | Optional | Not a boot device |
| BAR5 register | 32-bit, Non-prefetchable, MMIO | Is set to less than 4 GB. |

### Example of BAR usage on AMD GPUs[#](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#example-of-bar-usage-on-amd-gpus "Link to this heading")

Following is an example configuration of BARs set by the system BIOS on GFX8 GPUs with the 40-bit physical addressing limit:

11:00.0 Display controller: Advanced Micro Devices, Inc. [AMD/ATI] Fiji [Radeon R9 FURY / NANO
Series] (rev c1)

Subsystem: Advanced Micro Devices, Inc. [AMD/ATI] Device 0b35

Flags: bus master, fast devsel, latency 0, IRQ 119

Memory at bf40000000 (64-bit, prefetchable) [size=256M]

Memory at bf50000000 (64-bit, prefetchable) [size=2M]

I/O ports at 3000 [size=256]

Memory at c7400000 (32-bit, non-prefetchable) [size=256K]

Expansion ROM at c7440000 [disabled] [size=128K]

Details of the BARs configured in the example are:

**GPU Frame Buffer BAR:**`Memory at bf40000000 (64-bit, prefetchable) [size=256M]`

The size of the BAR in the example is 256 MB. Generally, it will be the size of the GPU memory (typically 4 GB+). Depending upon the physical address limit and generation of AMD GPUs, the BAR can be set below 2^40, 2^44, or 2^48.

**Doorbell BAR:**`Memory at bf50000000 (64-bit, prefetchable) [size=2M]`

The size of the BAR should typically be less than 10 MB for this generation of GPUs and has been set to 2 MB in the example. This BAR is placed less than 2^40 to allow peer-to-peer access from other generations of AMD GPUs.

**I/O BAR:**`I/O ports at 3000 [size=256]`

This is for legacy VGA and boot device support. Because the GPUs used are not connected to a display (VGA devices), this is not a concern, even if it isn’t set up in the system BIOS.

**MMIO BAR:**`Memory at c7400000 (32-bit, non-prefetchable) [size=256K]`

The AMD Driver requires this to access the configuration registers. Since the reminder of the BAR available is only 1 DWORD (32-bit), this is set less than 4 GB. In the example, it is fixed at 256 KB.

**Expansion ROM:**`Expansion ROM at c7440000 [disabled] [size=128K]`

This is required by the AMD Driver to access the GPU video-BIOS. In the example, it is fixed at 128 KB.

[previous Setting the number of compute units](https://rocm.docs.amd.com/en/latest/how-to/setting-cus.html "previous page")[next GPU architecture documentation](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch.html "next page")

 Contents 

*   [Handling physical address limitation](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#handling-physical-address-limitation)
*   [BAR configuration for AMD GPUs](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#bar-configuration-for-amd-gpus)
    *   [Example of BAR usage on AMD GPUs](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#example-of-bar-usage-on-amd-gpus)

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Supply Chain Transparency](https://www.amd.com/content/dam/amd/en/documents/corporate/cr/supply-chain-transparency.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#cookie-settings)

© 2025 Advanced Micro Devices, Inc

Cookie Notice
-------------

This website uses cookies and other tracking technologies to enhance user experience and to analyze performance and traffic on our website. We also share information about your use of our site with our social media, advertising and analytics partners. If a [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/en/latest/how-to/Bar-Memory.html#cookiesettings) preference is detected it will be honored. Further information is available in our [Cookies Policy](https://www.amd.com/en/legal/cookies.html) and [Privacy Notice](https://www.amd.com/en/legal/privacy.html).

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
