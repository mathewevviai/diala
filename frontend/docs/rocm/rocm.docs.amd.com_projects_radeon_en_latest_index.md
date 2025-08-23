Title: Use ROCm on Radeon GPUs — Use ROCm on Radeon GPUs

URL Source: https://rocm.docs.amd.com/projects/radeon/en/latest/index.html

Markdown Content:
Use ROCm on Radeon GPUs — Use ROCm on Radeon GPUs

===============

[Skip to main content](https://rocm.docs.amd.com/projects/radeon/en/latest/index.html#main-content)

Back to top- [x] - [x] 

Ctrl+K

[![Image 1: AMD Logo](https://rocm.docs.amd.com/projects/radeon/en/latest/_static/images/amd-header-logo.svg)](https://www.amd.com/)[Radeon Software for Linux](https://rocm.docs.amd.com/)[Version List](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/release/versions.html)

*   [Community](https://github.com/RadeonOpenCompute/ROCm/discussions)
*   [AMD Lab Notes](https://gpuopen.com/learn/amd-lab-notes/amd-lab-notes-readme/)
*   [Infinity Hub](https://www.amd.com/en/technologies/infinity-hub)
*   [Support](https://github.com/ROCm/ROCm/issues/new/choose)

[Use ROCm on Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/index.html#)

Search Ctrl+K

*   [Prerequisites](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/prerequisites.html)
*   [How to guides](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/howto.html)

    *   [Linux How to guide](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/howto_native_linux.html)

        *   [Install Radeon software for Linux with ROCm](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/install-radeon.html)
        *   [Install PyTorch for Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/install-pytorch.html)
        *   [Install ONNX Runtime for Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/install-onnx.html)
        *   [Install TensorFlow for Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/install-tensorflow.html)
        *   [Install Triton for Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/install-triton.html)
        *   [Install JAX for Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/install-jax.html)
        *   [Install MIGraphX for Radeon GPUs](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/install-migraphx.html)
        *   [mGPU setup and configuration](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/native_linux/mgpu.html)

    *   [WSL How to guide](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/howto_wsl.html)

        *   [Install Radeon software for WSL with ROCm](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-radeon.html)
        *   [Install PyTorch for Radeon GPUs on WSL](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-pytorch.html)
        *   [Install ONNX Runtime for Radeon GPUs on WSL](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-onnx.html)
        *   [Install TensorFlow for Radeon GPUs on WSL](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-tensorflow.html)
        *   [Install Triton for Radeon GPUs on WSL](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-triton.html)
        *   [Install JAX for Radeon GPUs on WSL](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-jax.html)
        *   [Install MIGraphX for Radeon GPUs on WSL](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/install/wsl/install-migraphx.html)

*   [Usecases](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/advanced/usecases.html)

    *   [vLLM](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/advanced/vllm/vllm.html)

        *   [vLLM Docker image for Llama2 and Llama3](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/advanced/vllm/build-docker-image.html)
        *   [GEMM tuning for model inferencing with vLLM](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/advanced/vllm/gemm-tuning.html)

    *   [ComfyUI](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/advanced/comfyui/comfyui.html)

        *   [Install ComfyUI and MIGraphX extension](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/advanced/comfyui/installcomfyui.html)

*   [Compatibility matrices](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/compatibility.html)

    *   [Linux Compatibility](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/compatibility/native_linux/native_linux_compatibility.html)
    *   [WSL Compatibility](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/compatibility/wsl/wsl_compatibility.html)

*   [Limitations and recommended settings](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/limitations.html)
*   [AI community](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/ai-community.html)
*   [Report a bug](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/feedback.html)

Use ROCm on Radeon GPUs
=======================

Use ROCm on Radeon GPUs[#](https://rocm.docs.amd.com/projects/radeon/en/latest/index.html#use-rocm-on-radeon-gpus "Link to this heading")
=========================================================================================================================================

**Turn your desktop into a Machine Learning platform with the latest high-end AMD Radeon™ 9000 and 7000 series GPUs**

AMD has expanded support for Machine Learning Development on RDNA™ 4 and RDNA™ 3 GPUs with Radeon™ Software for Linux 25.10.1 with ROCm™ 6.4.1.

Researchers and developers working with Machine Learning (ML) models and algorithms using PyTorch, ONNX Runtime, JAX, or TensorFlow can now also use ROCm 6.4.1 on Linux® to tap into the parallel computing power of the newest high-end AMD Radeon GPUs for desktop, including:

*   AMD Radeon™ AI PRO R9700

*   AMD Radeon™ RX 9070

*   AMD Radeon™ RX 9070 XT

*   AMD Radeon™ RX 9070 GRE

*   AMD Radeon™ RX 9060 XT

These new GPUs based on the RDNA 4 architecture join the already-supported Radeon 7000 series built on RDNA 3, further expanding support for high-performance local ML development on Linux®.

A client solution built on powerful high-end AMD GPUs enables a local, private, and cost-effective workflow to develop ROCm and train Machine Learning for users who were solely reliant on cloud-based solutions.

**More ML performance for your desktop**

*   With today’s models easily exceeding the capabilities of standard hardware and software not designed for AI, ML engineers are looking for cost-effective solutions to develop and train their ML-powered applications. Due to the availability of significantly large GPU memory sizes of 24GB or 48GB, utilization of a local PC or workstation equipped with the latest high-end AMD Radeon 9000 & 7000 series GPU offers a robust/potent yet economical option to meet these expanding ML workflow challenges.

*   Latest high-end AMD Radeon 9000 series GPUs are built on the RDNA 4 GPU architecture and AMD Radeon 7000 series GPUs are built on the RDNA 3 GPU architecture

    *   offers up to 24GB or 48GB of GPU memory to handle large ML models

**Migrate your application from the desktop to the datacenter**

*   ROCm is the open-source software stack for Graphics Processing Unit (GPU) programming. ROCm spans several domains: General-Purpose computing on GPUs (GPGPU), High Performance Computing (HPC) and heterogeneous computing.

*   The latest AMD ROCm 6.4.1 software stack for GPU programming unlocks the massively parallel compute power of these RDNA 4 and RDNA3 GPUs for use with various ML frameworks. The same software stack also supports AMD CDNA™ GPU architecture, so developers can migrate applications from their preferred framework into the datacenter.

**Freedom to customize**

ROCm is primarily Open-Source Software (OSS) that allows developers the freedom to customize and tailor their GPU software for their own needs while collaborating with a community of other developers, and helping each other find solutions in an agile, flexible, rapid and secure manner. AMD ROCm allows users to maximize their GPU hardware investment. ROCm is designed to help develop, test and deploy GPU accelerated HPC, AI, scientific computing, CAD, and other applications in a free, open-source, integrated and secure software ecosystem.

**Improved interoperability**

*   Support for PyTorch, one of the leading ML frameworks.

*   Support for ONNX Runtime to perform inference on a wider range of source data, including INT8 with MIGraphX.

*   Support for TensorFlow.

**Radeon™ Software for Linux® 25.10.1 with ROCm 6.4.1 Highlights**

*   Support for Llama.cpp

*   Forward Attention 2 (FA2) backward pass enablement

*   Support for JAX (inference)

*   New models
    *   Llama 3.1

    *   Qwen 1.5

    *   ChatGLM 2/4

*   Support for RedHat Enterprise Linux (RHEL) 9.6 (excluding WSL)

Note

Visit [AMD ROCm Documentation](https://rocmdocs.amd.com/) for the latest on ROCm.

For the latest driver installation packages, visit [Linux Drivers for Radeon Software](https://www.amd.com/en/support/download/linux-drivers.html).

[next Prerequisites to use ROCm on Radeon desktop GPUs for machine learning development](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/prerequisites.html "next page")

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Statement on Forced Labor](https://www.amd.com/system/files/documents/statement-human-trafficking-forced-labor.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Cookie Settings](https://rocm.docs.amd.com/projects/radeon/en/latest/index.html#cookie-settings)

© 2025 Advanced Micro Devices, Inc

Cookie Notice
-------------

This site uses cookies from us and our partners to make your browsing experience more efficient, relevant, convenient and personal. In some cases, they are essential to making the site work properly. By accessing this site, you direct us to use and consent to the use of cookies. You can change your settings by clicking on the Cookie Settings link. For more information, refer to AMD's [privacy notice](https://www.amd.com/en/legal/privacy.html) and [cookie policy](https://www.amd.com/en/legal/cookies.html).

Cookie Settings Accept Cookies

![Image 2: Company Logo](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1c-1c89-73f7-b102-a161872053dc/logos/522af4e3-8eb6-419a-ab34-33424f162acd/b5753b26-66ca-48b2-9cf8-f49f6f86d4fc/8ea1ec5d-9e72-477e-af81-45810eb32c32/AMD-Logo-700x394.png)

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

[![Image 3: Powered by Onetrust](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1c-1c89-73f7-b102-a161872053dc/logos/static/powered_by_logo.svg)](https://www.onetrust.com/products/cookie-consent/)
