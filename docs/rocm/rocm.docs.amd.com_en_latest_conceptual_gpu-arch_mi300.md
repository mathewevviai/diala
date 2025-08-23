Title: AMD Instinct™ MI300 series microarchitecture — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html

Markdown Content:
AMD Instinct™ MI300 series microarchitecture — ROCm Documentation

===============

[Skip to main content](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#main-content)

Back to top- [x] - [x] 

Ctrl+K

[![Image 4: AMD Logo](https://rocm.docs.amd.com/en/latest/_static/images/amd-header-logo.svg)](https://www.amd.com/)[ROCm™ Software 6.4.1](https://rocm.docs.amd.com/en/latest)[Version List](https://rocm.docs.amd.com/en/latest/release/versions.html)

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

    *   [MI300 microarchitecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#)

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
*   [GPU architecture documentation](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch.html)
*   AMD...

AMD Instinct™ MI300 series microarchitecture
============================================

Contents
--------

*   [Node-level architecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#node-level-architecture)

AMD Instinct™ MI300 series microarchitecture[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#amd-instinct-mi300-series-microarchitecture "Link to this heading")
======================================================================================================================================================================================

2025-04-17

5 min read time

 Applies to Linux and Windows 

The AMD Instinct MI300 series accelerators are based on the AMD CDNA 3 architecture which was designed to deliver leadership performance for HPC, artificial intelligence (AI), and machine learning (ML) workloads. The AMD Instinct MI300 series accelerators are well-suited for extreme scalability and compute performance, running on everything from individual servers to the world’s largest exascale supercomputers.

With the MI300 series, AMD is introducing the Accelerator Complex Die (XCD), which contains the GPU computational elements of the processor along with the lower levels of the cache hierarchy.

The following image depicts the structure of a single XCD in the AMD Instinct MI300 accelerator series.

![Image 5: ../../_images/xcd-sys-arch.png](https://rocm.docs.amd.com/en/latest/_images/xcd-sys-arch.png)

XCD-level system architecture showing 40 Compute Units, each with 32 KB L1 cache, a Unified Compute System with 4 ACE Compute Accelerators, shared 4MB of L2 cache and an HWS Hardware Scheduler.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#mi300-xcd "Link to this image")

On the XCD, four Asynchronous Compute Engines (ACEs) send compute shader workgroups to the Compute Units (CUs). The XCD has 40 CUs: 38 active CUs at the aggregate level and 2 disabled CUs for yield management. The CUs all share a 4 MB L2 cache that serves to coalesce all memory traffic for the die. With less than half of the CUs of the AMD Instinct MI200 Series compute die, the AMD CDNA™ 3 XCD die is a smaller building block. However, it uses more advanced packaging and the processor can include 6 or 8 XCDs for up to 304 CUs, roughly 40% more than MI250X.

The MI300 Series integrate up to 8 vertically stacked XCDs, 8 stacks of High-Bandwidth Memory 3 (HBM3) and 4 I/O dies (containing system infrastructure) using the AMD Infinity Fabric™ technology as interconnect.

The Matrix Cores inside the CDNA 3 CUs have significant improvements, emphasizing AI and machine learning, enhancing throughput of existing data types while adding support for new data types. CDNA 2 Matrix Cores support FP16 and BF16, while offering INT8 for inference. Compared to MI250X accelerators, CDNA 3 Matrix Cores triple the performance for FP16 and BF16, while providing a performance gain of 6.8 times for INT8. FP8 has a performance gain of 16 times compared to FP32, while TF32 has a gain of 4 times compared to FP32.

Peak-performance capabilities of the MI300X for different data types.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#mi300x-perf-table "Link to this table")| Computation and Data Type | FLOPS/CLOCK/CU | Peak TFLOPS |
| --- | --- | --- |
| Matrix FP64 | 256 | 163.4 |
| Vector FP64 | 128 | 81.7 |
| Matrix FP32 | 256 | 163.4 |
| Vector FP32 | 256 | 163.4 |
| Vector TF32 | 1024 | 653.7 |
| Matrix FP16 | 2048 | 1307.4 |
| Matrix BF16 | 2048 | 1307.4 |
| Matrix FP8 | 4096 | 2614.9 |
| Matrix INT8 | 4096 | 2614.9 |

The above table summarizes the aggregated peak performance of the AMD Instinct MI300X Open Compute Platform (OCP) Open Accelerator Modules (OAMs) for different data types and command processors. The middle column lists the peak performance (number of data elements processed in a single instruction) of a single compute unit if a SIMD (or matrix) instruction is submitted in each clock cycle. The third column lists the theoretical peak performance of the OAM. The theoretical aggregated peak memory bandwidth of the GPU is 5.3 TB per second.

The following image shows the block diagram of the APU (left) and the OAM package (right) both connected via AMD Infinity Fabric™ network on-chip.

![Image 6](https://rocm.docs.amd.com/en/latest/_images/image008.png)

MI300 series system architecture showing MI300A (left) with 6 XCDs and 3 CCDs, while the MI300X (right) has 8 XCDs.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#mi300-arch "Link to this image")

Node-level architecture[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#node-level-architecture "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------

![Image 7: ../../_images/mi300-node-level-arch.png](https://rocm.docs.amd.com/en/latest/_images/mi300-node-level-arch.png)

MI300 series node-level architecture showing 8 fully interconnected MI300X OAM modules connected to (optional) PCIEe switches via retimers and HGX connectors.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#mi300-node "Link to this image")

The image above shows the node-level architecture of a system with AMD EPYC processors in a dual-socket configuration and eight AMD Instinct MI300X accelerators. The MI300X OAMs attach to the host system via PCIe Gen 5 x16 links (yellow lines). The GPUs are using seven high-bandwidth, low-latency AMD Infinity Fabric™ links (red lines) to form a fully connected 8-GPU system.

[previous GPU architecture documentation](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch.html "previous page")[next MI300 and MI200 series performance counters and metrics](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300-mi200-performance-counters.html "next page")

 Contents 

*   [Node-level architecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#node-level-architecture)

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Supply Chain Transparency](https://www.amd.com/content/dam/amd/en/documents/corporate/cr/supply-chain-transparency.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Cookie Settings](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html#cookie-settings)

© 2025 Advanced Micro Devices, Inc

Cookie Notice
-------------

This site uses cookies from us and our partners to make your browsing experience more efficient, relevant, convenient and personal. In some cases, they are essential to making the site work properly. By accessing this site, you direct us to use and consent to the use of cookies. You can change your settings by clicking on the Cookie Settings link. For more information, refer to AMD's [privacy notice](https://www.amd.com/en/legal/privacy.html) and [cookie policy](https://www.amd.com/en/legal/cookies.html).

Cookie Settings Accept Cookies

![Image 8: Company Logo](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1c-1c89-73f7-b102-a161872053dc/logos/522af4e3-8eb6-419a-ab34-33424f162acd/b5753b26-66ca-48b2-9cf8-f49f6f86d4fc/8ea1ec5d-9e72-477e-af81-45810eb32c32/AMD-Logo-700x394.png)

Cookie Settings
---------------

When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalized web experience. Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to find out more and change our default settings. However, blocking some types of cookies may impact your experience of the site and the services we are able to offer. 

[More information](https://www.amd.com/en/legal/cookies.html)

Allow All
### Manage Consent Preferences

#### Performance Cookies

- [x] Performance Cookies 

These cookies allow us to recognize and count the number of visitors and to see how visitors move around the Sites when they use them. This helps us to understand what areas of the Sites are of interest to you and to improve the way the Sites work, for example, by helping you find what you are looking for easily. We may use third party web analytics providers to help us analyze the use of the Sites, email, and newsletters. These cookies store data such as online identifiers (including IP address and device identifiers), information about your web browser and operating system, website usage activity information (including the frequency of your visits, your actions on the Sites and, if you arrived at any of the Sites from another website, i.e. the URL of that website), and content-related activity (including the email and newsletter content you view and click on).

Cookies Details‎

#### Targeting Cookies

- [x] Targeting Cookies 

These cookies record online identifiers (including IP address and device identifiers), information about your web browser and operating system, website usage activity information (such as information about your visit to the Sites, the pages you have visited, content you have viewed, and the links you have followed), and content-related activity (including the email and newsletter content you view and click on). The information is used to try to make the Sites, emails, and newsletters, and the advertising displayed on them and other websites more relevant to your interests. For instance, when you visit the Sites, these targeting cookies are used by third party providers for remarketing purposes to allow them to show you advertisements for our products when you visit other websites on the internet. Our third party providers may collect and combine information collected through the Sites, emails, and newsletters with other information about your visits to other websites and apps over time, if those websites and apps also use the same providers.

Cookies Details‎

#### Functionality Cookies

- [x] Functionality Cookies 

These cookies are used to recognize you when you return to the Sites. This enables us to remember your preferences (for example, your choice of language or region) or when you register on areas of the Sites, such as our web programs or extranets. These cookies store data such as online identifiers (including IP address and device identifiers) along with the information used to provide the function.

Cookies Details‎

#### Strictly Necessary Cookies

Always Active

These are cookies that are technically required for the operation of the Sites. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging into secure areas of the Sites or filling in forms. These cookies store data such as online identifiers (including IP address and device identifiers) along with the information used to operate the Sites. We may estimate your geographic location based on your IP address to help us display the content available in your location and adjust the operation of the Sites.

Cookies Details‎

### Cookie List

Clear

- [x] checkbox label label

Apply Cancel

Consent Leg.Interest

- [x] checkbox label label

- [x] checkbox label label

- [x] checkbox label label

Confirm My Choices

[![Image 9: Powered by Onetrust](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1c-1c89-73f7-b102-a161872053dc/logos/static/powered_by_logo.svg)](https://www.onetrust.com/products/cookie-consent/)
