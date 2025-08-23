Title: vLLM inference performance testing — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html

Markdown Content:
vLLM inference performance testing[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-inference-performance-testing "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-06-05

77 min read time

Applies to Linux

The [ROCm vLLM Docker](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) image offers a prebuilt, optimized environment for validating large language model (LLM) inference performance on AMD Instinct™ MI300X series accelerators. This ROCm vLLM Docker image integrates vLLM and PyTorch tailored specifically for MI300X series accelerators and includes the following components:

*   [ROCm 6.3.1](https://github.com/ROCm/ROCm)

*   [vLLM 0.8.5 (0.8.6.dev315+g91a560098.rocm631)](https://docs.vllm.ai/en/latest)

*   [PyTorch 2.7.0+gitf717b2a](https://github.com/ROCm/pytorch.git)

*   [hipBLASLt 0.15](https://github.com/ROCm/hipBLASLt)

With this Docker image, you can quickly test the [expected inference performance numbers](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-performance-measurements) for MI300X series accelerators.

Supported models[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#supported-models "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------

The following models are supported for inference performance benchmarking with vLLM and ROCm. Some instructions, commands, and recommendations in this documentation might vary by model – select one to get started.

Model group

Meta Llama

Mistral AI

Qwen

Databricks DBRX

Google Gemma

Cohere

DeepSeek

Microsoft Phi

TII Falcon

Model

Llama 3.1 8B

Llama 3.1 70B

Llama 3.1 405B

Llama 3.2 11B Vision

Llama 2 7B

Llama 2 70B

Llama 3.1 8B FP8

Llama 3.1 70B FP8

Llama 3.1 405B FP8

Mixtral MoE 8x7B

Mixtral MoE 8x22B

Mistral 7B

Mixtral MoE 8x7B FP8

Mixtral MoE 8x22B FP8

Mistral 7B FP8

Qwen2 7B

Qwen2 72B

QwQ-32B

DBRX Instruct

DBRX Instruct FP8

Gemma 2 27B

C4AI Command R+ 08-2024

C4AI Command R+ 08-2024 FP8

DeepSeek MoE 16B

Phi-4

Falcon 180B

Note

See the [Llama 3.1 8B model card on Hugging Face](https://huggingface.co/meta-llama/Llama-3.1-8B) to learn more about your selected model. Some models require access authorization prior to use via an external license agreement through a third party.

Note

vLLM is a toolkit and library for LLM inference and serving. AMD implements high-performance custom kernels and modules in vLLM to enhance performance. See [vLLM inference](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#fine-tuning-llms-vllm) and [vLLM performance optimization](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/workload.html#mi300x-vllm-optimization) for more information.

Performance measurements[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#performance-measurements "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------------------------------------------------

To evaluate performance, the [Performance results with AMD ROCm software](https://www.amd.com/en/developer/resources/rocm-hub/dev-ai/performance-results.html) page provides reference throughput and latency measurements for inferencing popular AI models.

Advanced features and known issues[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#advanced-features-and-known-issues "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

For information on experimental features and known issues related to ROCm optimization efforts on vLLM, see the developer’s guide at [ROCm/vllm](https://github.com/ROCm/vllm/blob/main/docs/dev-docker/README.md).

System validation[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#system-validation "Link to this heading")
----------------------------------------------------------------------------------------------------------------------------------------------------------

Before running AI workloads, it’s important to validate that your AMD hardware is configured correctly and performing optimally.

To optimize performance, disable automatic NUMA balancing. Otherwise, the GPU might hang until the periodic balancing is finalized. For more information, see the [system validation steps](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/training/prerequisite-system-validation.html#rocm-for-ai-system-optimization).

# disable automatic NUMA balancing
sh -c 'echo 0 > /proc/sys/kernel/numa_balancing'
# check if NUMA balancing is disabled (returns 0 if disabled)
cat /proc/sys/kernel/numa_balancing
0

To test for optimal performance, consult the recommended [System health benchmarks](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/system-health-check.html#rocm-for-ai-system-health-bench). This suite of tests will help you verify and fine-tune your system’s configuration.

Pull the Docker image[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#pull-the-docker-image "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Download the [ROCm vLLM Docker image](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11). Use the following command to pull the Docker image from Docker Hub.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

Benchmarking[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#benchmarking "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------------------------

Once the setup is complete, choose between two options to reproduce the benchmark results:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 3.1 8B](https://huggingface.co/meta-llama/Llama-3.1-8B) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-3.1-8b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-3.1-8b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m meta-llama/Llama-3.1-8B-Instruct -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 3.1 8B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m meta-llama/Llama-3.1-8B-Instruct -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.1-8B-Instruct_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 3.1 8B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m meta-llama/Llama-3.1-8B-Instruct -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.1-8B-Instruct_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 3.1 70B](https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-3.1-70b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-3.1-70b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m meta-llama/Llama-3.1-70B-Instruct -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 3.1 70B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m meta-llama/Llama-3.1-70B-Instruct -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.1-70B-Instruct_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 3.1 70B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m meta-llama/Llama-3.1-70B-Instruct -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.1-70B-Instruct_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 3.1 405B](https://huggingface.co/meta-llama/Llama-3.1-405B-Instruct) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-3.1-405b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-3.1-405b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m meta-llama/Llama-3.1-405B-Instruct -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 3.1 405B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m meta-llama/Llama-3.1-405B-Instruct -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.1-405B-Instruct_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 3.1 405B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m meta-llama/Llama-3.1-405B-Instruct -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.1-405B-Instruct_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 3.2 11B Vision](https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-3.2-11b-vision-instruct --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-3.2-11b-vision-instruct`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m meta-llama/Llama-3.2-11B-Vision-Instruct -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 3.2 11B Vision model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m meta-llama/Llama-3.2-11B-Vision-Instruct -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.2-11B-Vision-Instruct_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 3.2 11B Vision model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m meta-llama/Llama-3.2-11B-Vision-Instruct -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-3.2-11B-Vision-Instruct_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 2 7B](https://huggingface.co/meta-llama/Llama-2-7b-chat-hf) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-2-7b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-2-7b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m meta-llama/Llama-2-7b-chat-hf -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 2 7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m meta-llama/Llama-2-7b-chat-hf -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-2-7b-chat-hf_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 2 7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m meta-llama/Llama-2-7b-chat-hf -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-2-7b-chat-hf_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 2 70B](https://huggingface.co/meta-llama/Llama-2-70b-chat-hf) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-2-70b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-2-70b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m meta-llama/Llama-2-70b-chat-hf -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 2 70B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m meta-llama/Llama-2-70b-chat-hf -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-2-70b-chat-hf_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 2 70B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m meta-llama/Llama-2-70b-chat-hf -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Llama-2-70b-chat-hf_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 3.1 8B FP8](https://huggingface.co/amd/Llama-3.1-8B-Instruct-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-3.1-8b_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-3.1-8b_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/Llama-3.1-8B-Instruct-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 3.1 8B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/Llama-3.1-8B-Instruct-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/Llama-3.1-8B-Instruct-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 3.1 8B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/Llama-3.1-8B-Instruct-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/Llama-3.1-8B-Instruct-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 3.1 70B FP8](https://huggingface.co/amd/Llama-3.1-70B-Instruct-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-3.1-70b_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-3.1-70b_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/Llama-3.1-70B-Instruct-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 3.1 70B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/Llama-3.1-70B-Instruct-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/Llama-3.1-70B-Instruct-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 3.1 70B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/Llama-3.1-70B-Instruct-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/Llama-3.1-70B-Instruct-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Llama 3.1 405B FP8](https://huggingface.co/amd/Llama-3.1-405B-Instruct-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_llama-3.1-405b_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_llama-3.1-405b_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/Llama-3.1-405B-Instruct-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Llama 3.1 405B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/Llama-3.1-405B-Instruct-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/Llama-3.1-405B-Instruct-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Llama 3.1 405B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/Llama-3.1-405B-Instruct-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/Llama-3.1-405B-Instruct-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Mixtral MoE 8x7B](https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_mixtral-8x7b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_mixtral-8x7b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m mistralai/Mixtral-8x7B-Instruct-v0.1 -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Mixtral MoE 8x7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m mistralai/Mixtral-8x7B-Instruct-v0.1 -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Mixtral-8x7B-Instruct-v0.1_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Mixtral MoE 8x7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m mistralai/Mixtral-8x7B-Instruct-v0.1 -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Mixtral-8x7B-Instruct-v0.1_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Mixtral MoE 8x22B](https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_mixtral-8x22b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_mixtral-8x22b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m mistralai/Mixtral-8x22B-Instruct-v0.1 -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Mixtral MoE 8x22B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m mistralai/Mixtral-8x22B-Instruct-v0.1 -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Mixtral-8x22B-Instruct-v0.1_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Mixtral MoE 8x22B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m mistralai/Mixtral-8x22B-Instruct-v0.1 -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Mixtral-8x22B-Instruct-v0.1_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Mistral 7B](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_mistral-7b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_mistral-7b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m mistralai/Mistral-7B-Instruct-v0.3 -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Mistral 7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m mistralai/Mistral-7B-Instruct-v0.3 -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Mistral-7B-Instruct-v0.3_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Mistral 7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m mistralai/Mistral-7B-Instruct-v0.3 -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Mistral-7B-Instruct-v0.3_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Mixtral MoE 8x7B FP8](https://huggingface.co/amd/Mixtral-8x7B-Instruct-v0.1-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_mixtral-8x7b_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_mixtral-8x7b_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/Mixtral-8x7B-Instruct-v0.1-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Mixtral MoE 8x7B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/Mixtral-8x7B-Instruct-v0.1-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/Mixtral-8x7B-Instruct-v0.1-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Mixtral MoE 8x7B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/Mixtral-8x7B-Instruct-v0.1-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/Mixtral-8x7B-Instruct-v0.1-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Mixtral MoE 8x22B FP8](https://huggingface.co/amd/Mixtral-8x22B-Instruct-v0.1-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_mixtral-8x22b_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_mixtral-8x22b_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/Mixtral-8x22B-Instruct-v0.1-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Mixtral MoE 8x22B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/Mixtral-8x22B-Instruct-v0.1-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/Mixtral-8x22B-Instruct-v0.1-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Mixtral MoE 8x22B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/Mixtral-8x22B-Instruct-v0.1-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/Mixtral-8x22B-Instruct-v0.1-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Mistral 7B FP8](https://huggingface.co/amd/Mistral-7B-v0.1-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_mistral-7b_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_mistral-7b_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/Mistral-7B-v0.1-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Mistral 7B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/Mistral-7B-v0.1-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/Mistral-7B-v0.1-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Mistral 7B FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/Mistral-7B-v0.1-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/Mistral-7B-v0.1-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Qwen2 7B](https://huggingface.co/Qwen/Qwen2-7B-Instruct) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_qwen2-7b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_qwen2-7b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m Qwen/Qwen2-7B-Instruct -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Qwen2 7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m Qwen/Qwen2-7B-Instruct -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Qwen2-7B-Instruct_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Qwen2 7B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m Qwen/Qwen2-7B-Instruct -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Qwen2-7B-Instruct_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Qwen2 72B](https://huggingface.co/Qwen/Qwen2-72B-Instruct) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_qwen2-72b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_qwen2-72b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m Qwen/Qwen2-72B-Instruct -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Qwen2 72B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m Qwen/Qwen2-72B-Instruct -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/Qwen2-72B-Instruct_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Qwen2 72B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m Qwen/Qwen2-72B-Instruct -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/Qwen2-72B-Instruct_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [QwQ-32B](https://huggingface.co/Qwen/QwQ-32B) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_qwq-32b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_qwq-32b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Note

For improved performance, consider enabling [PyTorch TunableOp](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/workload.html#mi300x-tunableop). TunableOp automatically explores different implementations and configurations of certain PyTorch operators to find the fastest one for your hardware.

By default, `pyt_vllm_qwq-32b` runs with TunableOp disabled (see [ROCm/MAD](https://github.com/ROCm/MAD/blob/develop/models.json)). To enable it, edit the default run behavior in the `models.json` configuration before running inference – update the model’s run `args` by changing `--tunableop off` to `--tunableop on`.

Enabling TunableOp triggers a two-pass run – a warm-up followed by the performance-collection run.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m Qwen/QwQ-32B -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the QwQ-32B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m Qwen/QwQ-32B -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/QwQ-32B_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the QwQ-32B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m Qwen/QwQ-32B -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/QwQ-32B_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [DBRX Instruct](https://huggingface.co/databricks/dbrx-instruct) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_dbrx-instruct --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_dbrx-instruct`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m databricks/dbrx-instruct -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the DBRX Instruct model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m databricks/dbrx-instruct -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/dbrx-instruct_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the DBRX Instruct model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m databricks/dbrx-instruct -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/dbrx-instruct_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [DBRX Instruct FP8](https://huggingface.co/amd/dbrx-instruct-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_dbrx_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_dbrx_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/dbrx-instruct-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the DBRX Instruct FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/dbrx-instruct-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/dbrx-instruct-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the DBRX Instruct FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/dbrx-instruct-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/dbrx-instruct-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Gemma 2 27B](https://huggingface.co/google/gemma-2-27b) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_gemma-2-27b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_gemma-2-27b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m google/gemma-2-27b -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Gemma 2 27B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m google/gemma-2-27b -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/gemma-2-27b_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Gemma 2 27B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m google/gemma-2-27b -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/gemma-2-27b_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [C4AI Command R+ 08-2024](https://huggingface.co/CohereForAI/c4ai-command-r-plus-08-2024) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_c4ai-command-r-plus-08-2024 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_c4ai-command-r-plus-08-2024`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m CohereForAI/c4ai-command-r-plus-08-2024 -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the C4AI Command R+ 08-2024 model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m CohereForAI/c4ai-command-r-plus-08-2024 -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/c4ai-command-r-plus-08-2024_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the C4AI Command R+ 08-2024 model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m CohereForAI/c4ai-command-r-plus-08-2024 -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/c4ai-command-r-plus-08-2024_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [C4AI Command R+ 08-2024 FP8](https://huggingface.co/amd/c4ai-command-r-plus-FP8-KV) model using one GPU with the `float8` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_command-r-plus_fp8 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_command-r-plus_fp8`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float8/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m amd/c4ai-command-r-plus-FP8-KV -g $num_gpu -d float8

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the C4AI Command R+ 08-2024 FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s latency -m amd/c4ai-command-r-plus-FP8-KV -g 8 -d float8 
Find the latency report at `./reports_float8_vllm_rocm6.3.1/summary/c4ai-command-r-plus-FP8-KV_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the C4AI Command R+ 08-2024 FP8 model on eight GPUs with `float8` precision.

./vllm_benchmark_report.sh -s throughput -m amd/c4ai-command-r-plus-FP8-KV -g 8 -d float8 
Find the throughput report at `./reports_float8_vllm_rocm6.3.1/summary/c4ai-command-r-plus-FP8-KV_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [DeepSeek MoE 16B](https://huggingface.co/deepseek-ai/deepseek-moe-16b-chat) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_deepseek-moe-16b-chat --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_deepseek-moe-16b-chat`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m deepseek-ai/deepseek-moe-16b-chat -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the DeepSeek MoE 16B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m deepseek-ai/deepseek-moe-16b-chat -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/deepseek-moe-16b-chat_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the DeepSeek MoE 16B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m deepseek-ai/deepseek-moe-16b-chat -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/deepseek-moe-16b-chat_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Phi-4](https://huggingface.co/microsoft/phi-4) model using one GPU with the [``](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#id25)`` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_phi-4 --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_phi-4`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m microsoft/phi-4 -g $num_gpu -d 

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Phi-4 model on eight GPUs with [``](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#id28)`` precision.

./vllm_benchmark_report.sh -s latency -m microsoft/phi-4 -g 8 -d  
Find the latency report at `./reports__vllm_rocm6.3.1/summary/phi-4_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Phi-4 model on eight GPUs with [``](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#id30)`` precision.

./vllm_benchmark_report.sh -s throughput -m microsoft/phi-4 -g 8 -d  
Find the throughput report at `./reports__vllm_rocm6.3.1/summary/phi-4_throughput_report.csv`.

Note

Throughput is calculated as:

MAD-integrated benchmarking

Clone the ROCm Model Automation and Dashboarding ([ROCm/MAD](https://github.com/ROCm/MAD)) repository to a local directory and install the required packages on the host machine.

git clone https://github.com/ROCm/MAD
cd MAD
pip install -r requirements.txt

Use this command to run the performance benchmark test on the [Falcon 180B](https://huggingface.co/tiiuae/falcon-180B) model using one GPU with the `float16` data type on the host machine.

export MAD_SECRETS_HFTOKEN="your personal Hugging Face token to access gated models"
python3 tools/run_models.py --tags pyt_vllm_falcon-180b --keep-model-dir --live-output --timeout 28800

MAD launches a Docker container with the name `container_ci-pyt_vllm_falcon-180b`. The latency and throughput reports of the model are collected in the following path: `~/MAD/reports_float16/`.

Although the [available models](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#vllm-benchmark-available-models) are preconfigured to collect latency and throughput performance data, you can also change the benchmarking parameters. See the standalone benchmarking tab for more information.

Standalone benchmarking

Run the vLLM benchmark tool independently by starting the [Docker container](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250521/images/sha256-38410c51af7208897cd8b737c9bdfc126e9bc8952d4aa6b88c85482f03092a11) as shown in the following snippet.

docker pull rocm/vllm:rocm6.3.1_vllm0.8.5_20250521
docker run -it --device=/dev/kfd --device=/dev/dri --group-add video --shm-size 16G --security-opt seccomp=unconfined --security-opt apparmor=unconfined --cap-add=SYS_PTRACE -v $(pwd):/workspace --env HUGGINGFACE_HUB_CACHE=/workspace --name test rocm/vllm:rocm6.3.1_vllm0.8.5_20250521

In the Docker container, clone the ROCm MAD repository and navigate to the benchmark scripts directory at `~/MAD/scripts/vllm`.

git clone https://github.com/ROCm/MAD
cd MAD/scripts/vllm

To start the benchmark, use the following command with the appropriate options.

./vllm_benchmark_report.sh -s $test_option -m tiiuae/falcon-180B -g $num_gpu -d float16

| Name | Options | Description |
| --- | --- | --- |
| `$test_option` | latency | Measure decoding token latency |
|  | throughput | Measure token generation throughput |
|  | all | Measure both throughput and latency |
| `$num_gpu` | 1 or 8 | Number of GPUs |
| `$datatype` | `float16` or `float8` | Data type |

Note

The input sequence length, output sequence length, and tensor parallel (TP) are already configured. You don’t need to specify them with this script.

Note

If you encounter the following error, pass your access-authorized Hugging Face token to the gated models.

OSError: You are trying to access a gated repo.

# pass your HF_TOKEN
export HF_TOKEN=$your_personal_hf_token

Here are some examples of running the benchmark with various options.

*   Latency benchmark

Use this command to benchmark the latency of the Falcon 180B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s latency -m tiiuae/falcon-180B -g 8 -d float16 
Find the latency report at `./reports_float16_vllm_rocm6.3.1/summary/falcon-180B_latency_report.csv`.

*   Throughput benchmark

Use this command to benchmark the throughput of the Falcon 180B model on eight GPUs with `float16` precision.

./vllm_benchmark_report.sh -s throughput -m tiiuae/falcon-180B -g 8 -d float16 
Find the throughput report at `./reports_float16_vllm_rocm6.3.1/summary/falcon-180B_throughput_report.csv`.

Note

Throughput is calculated as:

Further reading[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#further-reading "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------------------------------

*   To learn more about the options for latency and throughput benchmark scripts, see [ROCm/vllm](https://github.com/ROCm/vllm/tree/main/benchmarks).

*   To learn more about system settings and management practices to configure your system for MI300X accelerators, see [AMD Instinct MI300X system optimization](https://instinct.docs.amd.com/projects/amdgpu-docs/en/latest/system-optimization/mi300x.html)

*   For application performance optimization strategies for HPC and AI workloads, including inference with vLLM, see [AMD Instinct MI300X workload optimization](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/workload.html).

*   To learn how to run LLM models from Hugging Face or your own model, see [Running models from Hugging Face](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html).

*   To learn how to optimize inference on LLMs, see [Inference optimization](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/index.html).

*   To learn how to fine-tune LLMs, see [Fine-tuning LLMs](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/index.html).

Previous versions[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/vllm.html#previous-versions "Link to this heading")
----------------------------------------------------------------------------------------------------------------------------------------------------------

This table lists previous versions of the ROCm vLLM inference Docker image for inference performance testing. For detailed information about available models for benchmarking, see the version-specific documentation.

| ROCm version | vLLM version | PyTorch version | Resources |
| --- | --- | --- | --- |
| 6.3.1 | 0.8.5 | 2.7.0 | * [Documentation](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/benchmark-docker/previous-versions/vllm-0.8.5-20250513.html) * [Docker Hub](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_vllm_0.8.5_20250513/images/sha256-5c8b4436dd0464119d9df2b44c745fadf81512f18ffb2f4b5dc235c71ebe26b4) |
| 6.3.1 | 0.8.3 | 2.7.0 | * [Documentation](https://rocm.docs.amd.com/en/docs-6.4.0/how-to/rocm-for-ai/inference/vllm-benchmark.html) * [Docker Hub](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_instinct_vllm0.8.3_20250415/images/sha256-ad9062dea3483d59dedb17c67f7c49f30eebd6eb37c3fac0a171fb19696cc845) |
| 6.3.1 | 0.7.3 | 2.7.0 | * [Documentation](https://rocm.docs.amd.com/en/docs-6.3.3/how-to/rocm-for-ai/inference/vllm-benchmark.html) * [Docker Hub](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_instinct_vllm0.7.3_20250325/images/sha256-25245924f61750b19be6dcd8e787e46088a496c1fe17ee9b9e397f3d84d35640) |
| 6.3.1 | 0.6.6 | 2.7.0 | * [Documentation](https://rocm.docs.amd.com/en/docs-6.3.2/how-to/rocm-for-ai/inference/vllm-benchmark.html) * [Docker Hub](https://hub.docker.com/layers/rocm/vllm/rocm6.3.1_mi300_ubuntu22.04_py3.12_vllm_0.6.6/images/sha256-9a12ef62bbbeb5a4c30a01f702c8e025061f575aa129f291a49fbd02d6b4d6c9) |
| 6.2.1 | 0.6.4 | 2.5.0 | * [Documentation](https://rocm.docs.amd.com/en/docs-6.3.0/how-to/performance-validation/mi300x/vllm-benchmark.html) * [Docker Hub](https://hub.docker.com/layers/rocm/vllm/rocm6.2_mi300_ubuntu20.04_py3.9_vllm_0.6.4/images/sha256-ccbb74cc9e7adecb8f7bdab9555f7ac6fc73adb580836c2a35ca96ff471890d8) |
| 6.2.0 | 0.4.3 | 2.4.0 | * [Documentation](https://rocm.docs.amd.com/en/docs-6.2.0/how-to/performance-validation/mi300x/vllm-benchmark.html) * [Docker Hub](https://hub.docker.com/layers/rocm/vllm/rocm6.2_mi300_ubuntu22.04_py3.9_vllm_7c5fd50/images/sha256-9e4dd4788a794c3d346d7d0ba452ae5e92d39b8dfac438b2af8efdc7f15d22c0) |
