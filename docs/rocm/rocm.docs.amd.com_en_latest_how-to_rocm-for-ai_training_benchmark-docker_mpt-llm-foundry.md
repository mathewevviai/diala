Title: Training MPT-30B with LLM Foundry and ROCm — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html

Markdown Content:
Training MPT-30B with LLM Foundry and ROCm — ROCm Documentation

===============

[Skip to main content](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#main-content)

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
        *   [Train a model with LLM Foundry](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#)
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
*   [Use ROCm for AI](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/index.html)
*   [Use ROCm for training](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/index.html)
*   Training...

Training MPT-30B with LLM Foundry and ROCm
==========================================

Contents
--------

*   [System validation](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#system-validation)
*   [Getting started](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#getting-started)
*   [Interpreting the output](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#interpreting-the-output)

Training MPT-30B with LLM Foundry and ROCm[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#training-mpt-30b-with-llm-foundry-and-rocm "Link to this heading")
======================================================================================================================================================================================================================

2025-05-13

5 min read time

 Applies to Linux 

MPT-30B is a 30-billion parameter decoder-style transformer-based model from the Mosaic Pretrained Transformer (MPT) family – learn more about it in MosaicML’s research blog [MPT-30B: Raising the bar for open-source foundation models](https://www.databricks.com/blog/mpt-30b).

ROCm and [ROCm/MAD](https://github.com/ROCm/MAD) provide a pre-configured training environment for the MPT-30B model using the `rocm/pytorch-training:v25.5` base [Docker image](https://hub.docker.com/layers/rocm/pytorch-training/v25.5/images/sha256-d47850a9b25b4a7151f796a8d24d55ea17bba545573f0d50d54d3852f96ecde5) and the [LLM Foundry](https://github.com/mosaicml/llm-foundry) framework. This environment packages the following software components to train on AMD Instinct MI300X series accelerators:

| Software component | Version |
| --- | --- |
| ROCm | 6.3.4 |
| PyTorch | 2.7.0a0+git6374332 |
| Flash Attention | 3.0.0.post1 |

Using this image, you can build, run, and test the training process for MPT-30B with access to detailed logs and performance metrics.

System validation[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#system-validation "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------

Before running AI workloads, it’s important to validate that your AMD hardware is configured correctly and performing optimally.

If you have already validated your system settings, including aspects like NUMA auto-balancing, you can skip this step. Otherwise, complete the procedures in the [System validation and optimization](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/prerequisite-system-validation.html#rocm-for-ai-system-optimization) guide to properly configure your system settings before starting training.

To test for optimal performance, consult the recommended [System health benchmarks](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/system-health-check.html#rocm-for-ai-system-health-bench). This suite of tests will help you verify and fine-tune your system’s configuration.

Getting started[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#getting-started "Link to this heading")
----------------------------------------------------------------------------------------------------------------------------------------------------------------

The following procedures help you set up the training environment in a reproducible Docker container. This training environment is tailored for training MPT-30B using LLM Foundry and the specific model configurations outlined. Other configurations and run conditions outside those described in this document are not validated.

 MAD-integrated benchmarking 

On your host machine, clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to initiate the MPT-30B training benchmark.

python3 tools/run_models.py --tags pyt_mpt30b_training --keep-model-dir --live-output --clean-docker-cache

Tip

If you experience data download failures, set the `MAD_SECRETS_HFTOKEN` variable to your Hugging Face access token. See [User access tokens](https://huggingface.co/docs/hub/security-tokens) for details.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"

Note

For improved performance (training throughput), consider enabling TunableOp. By default, `pyt_mpt30b_training` runs with TunableOp disabled. To enable it, run `tools/run_models.py` with the `--tunableop on` argument or edit the `models.json` configuration before running training.

Although this might increase the initial training time, it can result in a performance gain.

 Standalone benchmarking 

To set up the training environment, clone the [ROCm/MAD](https://github.com/ROCm/MAD) repo and build the Docker image. In this snippet, the image is named `mosaic_mpt30_image`.

git clone https://github.com/ROCm/MAD
cd MAD

docker build --build-arg MAD_SYSTEM_GPU_ARCHITECTURE=gfx942 -f docker/pyt_mpt30b_training.ubuntu.amd.Dockerfile -t mosaic_mpt30_image .

Start a `mosaic_mpt30_image` container using the following command.

docker run -it --device=/dev/kfd --device=/dev/dri --group-add=video --ipc=host --shm-size=8G mosaic_mpt30_image

In the Docker container, clone the [ROCm/MAD](https://github.com/ROCm/MAD) repository and navigate to the benchmark scripts directory at `/workspace/MAD/scripts/pyt_mpt30b_training`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/pyt_mpt30b_training

To initiate the training process, use the following command. This script uses the hyperparameters defined in `mpt-30b-instruct.yaml`.

source run.sh

Note

For improved performance (training throughput), consider enabling TunableOp. To enable it, add the `--tunableop on` flag.

source run.sh --tunableop on

Although this might increase the initial training time, it can result in a performance gain.

Interpreting the output[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#interpreting-the-output "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

The training output will be displayed in the terminal and simultaneously saved to the `output.txt` file in the current directory. Key performance metrics will also be extracted and appended to the `perf_pyt_mpt30b_training.csv` file.

Key performance metrics include:

*   Training logs: Real-time display of loss metrics, accuracy, and training progress.

*   Model checkpoints: Periodically saved model snapshots for potential resume or evaluation.

*   Performance metrics: Detailed summaries of training speed and training loss metrics.

    *   Performance (throughput/samples_per_sec)

Overall throughput, measuring the total samples processed per second. Higher values indicate better hardware utilization.

    *   Performance per device (throughput/samples_per_sec)

Throughput on a per-device basis, showing how each GPU or CPU is performing.

    *   Language Cross Entropy (metrics/train/LanguageCrossEntropy)

Measures prediction accuracy. Lower cross entropy suggests the model’s output is closer to the expected distribution.

    *   Training loss (loss/train/total)

Overall training loss. A decreasing trend indicates the model is learning effectively.

[previous Training a model with MaxText for ROCm](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/jax-maxtext.html "previous page")[next Scaling model training](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/scale-model-training.html "next page")

 Contents 

*   [System validation](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#system-validation)
*   [Getting started](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#getting-started)
*   [Interpreting the output](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#interpreting-the-output)

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Supply Chain Transparency](https://www.amd.com/content/dam/amd/en/documents/corporate/cr/supply-chain-transparency.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Cookie Settings](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/benchmark-docker/mpt-llm-foundry.html#cookie-settings)

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
