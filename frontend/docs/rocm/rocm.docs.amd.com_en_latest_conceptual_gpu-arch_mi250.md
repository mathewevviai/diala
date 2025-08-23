Title: AMD Instinct™ MI250 microarchitecture — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html

Markdown Content:
AMD Instinct™ MI250 microarchitecture — ROCm Documentation

===============

[Skip to main content](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#main-content)

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

    *   [MI300 microarchitecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300.html)

        *   [AMD Instinct MI300/CDNA3 ISA](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/instruction-set-architectures/amd-instinct-mi300-cdna3-instruction-set-architecture.pdf)
        *   [White paper](https://www.amd.com/content/dam/amd/en/documents/instinct-tech-docs/white-papers/amd-cdna-3-white-paper.pdf)
        *   [MI300 and MI200 Performance counter](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300-mi200-performance-counters.html)

    *   [MI250 microarchitecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#)

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

AMD Instinct™ MI250 microarchitecture
=====================================

Contents
--------

*   [Node-level architecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#node-level-architecture)

AMD Instinct™ MI250 microarchitecture[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#amd-instinct-mi250-microarchitecture "Link to this heading")
========================================================================================================================================================================

2025-04-17

6 min read time

 Applies to Linux and Windows 

The microarchitecture of the AMD Instinct MI250 accelerators is based on the AMD CDNA 2 architecture that targets compute applications such as HPC, artificial intelligence (AI), and machine learning (ML) and that run on everything from individual servers to the world’s largest exascale supercomputers. The overall system architecture is designed for extreme scalability and compute performance.

The following image shows the components of a single Graphics Compute Die (GCD) of the CDNA 2 architecture. On the top and the bottom are AMD Infinity Fabric™ interfaces and their physical links that are used to connect the GPU die to the other system-level components of the node (see also Section 2.2). Both interfaces can drive four AMD Infinity Fabric links. One of the AMD Infinity Fabric links of the controller at the bottom can be configured as a PCIe link. Each of the AMD Infinity Fabric links between GPUs can run at up to 25 GT/sec, which correlates to a peak transfer bandwidth of 50 GB/sec for a 16-wide link ( two bytes per transaction). Section 2.2 has more details on the number of AMD Infinity Fabric links and the resulting transfer rates between the system-level components.

To the left and the right are memory controllers that attach the High Bandwidth Memory (HBM) modules to the GCD. AMD Instinct MI250 GPUs use HBM2e, which offers a peak memory bandwidth of 1.6 TB/sec per GCD.

The execution units of the GPU are depicted in the following image as Compute Units (CU). The MI250 GCD has 104 active CUs. Each compute unit is further subdivided into four SIMD units that process SIMD instructions of 16 data elements per instruction (for the FP64 data type). This enables the CU to process 64 work items (a so-called “wavefront”) at a peak clock frequency of 1.7 GHz. Therefore, the theoretical maximum FP64 peak performance per GCD is 22.6 TFLOPS for vector instructions. This equates to 45.3 TFLOPS for vector instructions for both GCDs together. The MI250 compute units also provide specialized execution units (also called matrix cores), which are geared toward executing matrix operations like matrix-matrix multiplications. For FP64, the peak performance of these units amounts to 90.5 TFLOPS.

![Image 5: Structure of a single GCD in the AMD Instinct MI250 accelerator.](https://rocm.docs.amd.com/en/latest/_images/image001.png)

Peak-performance capabilities of the MI250 OAM for different data types.[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#mi250-perf-table "Link to this table")| Computation and Data Type | FLOPS/CLOCK/CU | Peak TFLOPS |
| --- | --- | --- |
| Matrix FP64 | 256 | 90.5 |
| Vector FP64 | 128 | 45.3 |
| Matrix FP32 | 256 | 90.5 |
| Packed FP32 | 256 | 90.5 |
| Vector FP32 | 128 | 45.3 |
| Matrix FP16 | 1024 | 362.1 |
| Matrix BF16 | 1024 | 362.1 |
| Matrix INT8 | 1024 | 362.1 |

The above table summarizes the aggregated peak performance of the AMD Instinct MI250 OCP Open Accelerator Modules (OAM, OCP is short for Open Compute Platform) and its two GCDs for different data types and execution units. The middle column lists the peak performance (number of data elements processed in a single instruction) of a single compute unit if a SIMD (or matrix) instruction is being retired in each clock cycle. The third column lists the theoretical peak performance of the OAM module. The theoretical aggregated peak memory bandwidth of the GPU is 3.2 TB/sec (1.6 TB/sec per GCD).

![Image 6: Dual-GCD architecture of the AMD Instinct MI250 accelerators](https://rocm.docs.amd.com/en/latest/_images/image002.png)

The following image shows the block diagram of an OAM package that consists of two GCDs, each of which constitutes one GPU device in the system. The two GCDs in the package are connected via four AMD Infinity Fabric links running at a theoretical peak rate of 25 GT/sec, giving 200 GB/sec peak transfer bandwidth between the two GCDs of an OAM, or a bidirectional peak transfer bandwidth of 400 GB/sec for the same.

Node-level architecture[#](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#node-level-architecture "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------

The following image shows the node-level architecture of a system that is based on the AMD Instinct MI250 accelerator. The MI250 OAMs attach to the host system via PCIe Gen 4 x16 links (yellow lines). Each GCD maintains its own PCIe x16 link to the host part of the system. Depending on the server platform, the GCD can attach to the AMD EPYC processor directly or via an optional PCIe switch . Note that some platforms may offer an x8 interface to the GCDs, which reduces the available host-to-GPU bandwidth.

![Image 7: Block diagram of AMD Instinct MI250 Accelerators with 3rd Generation AMD EPYC processor](https://rocm.docs.amd.com/en/latest/_images/image003.png)

The preceding image shows the node-level architecture of a system with AMD EPYC processors in a dual-socket configuration and four AMD Instinct MI250 accelerators. The MI250 OAMs attach to the host processors system via PCIe Gen 4 x16 links (yellow lines). Depending on the system design, a PCIe switch may exist to make more PCIe lanes available for additional components like network interfaces and/or storage devices. Each GCD maintains its own PCIe x16 link to the host part of the system or to the PCIe switch. Please note, some platforms may offer an x8 interface to the GCDs, which will reduce the available host-to-GPU bandwidth.

Between the OAMs and their respective GCDs, a peer-to-peer (P2P) network allows for direct data exchange between the GPU dies via AMD Infinity Fabric links ( black, green, and red lines). Each of these 16-wide links connects to one of the two GPU dies in the MI250 OAM and operates at 25 GT/sec, which corresponds to a theoretical peak transfer rate of 50 GB/sec per link (or 100 GB/sec bidirectional peak transfer bandwidth). The GCD pairs 2 and 6 as well as GCDs 0 and 4 connect via two XGMI links, which is indicated by the thicker red line in the preceding image.

[previous MI300 and MI200 series performance counters and metrics](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi300-mi200-performance-counters.html "previous page")[next AMD Instinct™ MI100 microarchitecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi100.html "next page")

 Contents 

*   [Node-level architecture](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#node-level-architecture)

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Supply Chain Transparency](https://www.amd.com/content/dam/amd/en/documents/corporate/cr/supply-chain-transparency.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#cookie-settings)

© 2025 Advanced Micro Devices, Inc

Cookie Notice
-------------

This website uses cookies and other tracking technologies to enhance user experience and to analyze performance and traffic on our website. We also share information about your use of our site with our social media, advertising and analytics partners. If a [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch/mi250.html#cookiesettings) preference is detected it will be honored. Further information is available in our [Cookies Policy](https://www.amd.com/en/legal/cookies.html) and [Privacy Notice](https://www.amd.com/en/legal/privacy.html).

Cookie Settings Accept Cookies

![Image 8: Company Logo](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1f-b60d-748d-a5fd-db95d4430544/logos/522af4e3-8eb6-419a-ab34-33424f162acd/1563d021-9ae8-485d-a534-cc8715c52cbd/a0326644-47a6-416e-b4b4-b49d4fd8257a/AMD-Logo-700x394.png)

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

[![Image 9: Powered by Onetrust](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1f-b60d-748d-a5fd-db95d4430544/logos/static/powered_by_logo.svg)](https://www.onetrust.com/products/cookie-consent/)
