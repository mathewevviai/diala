Title: LLM inference frameworks — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html

Markdown Content:
Contents
--------

*   [vLLM inference](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#vllm-inference)
    *   [Installing vLLM](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#installing-vllm)

*   [Hugging Face TGI](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#fine-tuning-llms-tgi)
    *   [Install TGI](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#install-tgi)

LLM inference frameworks[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#llm-inference-frameworks "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-04-17

7 min read time

Applies to Linux

This section discusses how to implement [vLLM](https://docs.vllm.ai/en/latest) and [Hugging Face TGI](https://huggingface.co/docs/text-generation-inference/en/index) using [single-accelerator](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html) and [multi-accelerator](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/multi-gpu-fine-tuning-and-inference.html) systems.

vLLM inference[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#vllm-inference "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------

vLLM is renowned for its PagedAttention algorithm that can reduce memory consumption and increase throughput thanks to its paging scheme. Instead of allocating GPU high-bandwidth memory (HBM) for the maximum output token lengths of the models, the paged attention of vLLM allocates GPU HBM dynamically for its actual decoding lengths. This paged attention is also effective when multiple requests share the same key and value contents for a large value of beam search or multiple parallel requests.

vLLM also incorporates many modern LLM acceleration and quantization algorithms, such as Flash Attention, HIP and CUDA graphs, tensor parallel multi-GPU, GPTQ, AWQ, and token speculation.

### Installing vLLM[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#installing-vllm "Link to this heading")

1.   Run the following commands to build a Docker image `vllm-rocm`.

git clone https://github.com/vllm-project/vllm.git
cd vllm
docker build -f docker/Dockerfile.rocm -t vllm-rocm . 

vLLM on a single-accelerator system

1.   To use vLLM as an API server to serve reference requests, first start a container using the [vllm-rocm Docker image](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#fine-tuning-llms-vllm-rocm-docker-image).

docker run -it \
 --network=host \
 --group-add=video \
 --ipc=host \
 --cap-add=SYS_PTRACE \
 --security-opt seccomp=unconfined \
 --device /dev/kfd \
 --device /dev/dri \
 -v <path/to/model>:/app/model \
 vllm-rocm \
 bash 
2.   Inside the container, start the API server to run on a single accelerator on port 8000 using the following command.

python -m vllm.entrypoints.api_server --model /app/model --dtype float16 --port 8000 & 
The following log message is displayed in your command line indicates that the server is listening for requests.

![Image 1: vLLM API server log message](https://rocm.docs.amd.com/en/latest/_images/vllm-single-gpu-log.png)
3.   To test, send it a curl request containing a prompt.

curl http://localhost:8000/generate -H "Content-Type: application/json" -d '{"prompt": "What is AMD Instinct?", "max_tokens": 80, "temperature": 0.0 }' 
You should receive a response like the following.

{"text":["What is AMD Instinct?\nAmd Instinct is a brand new line of high-performance computing (HPC) processors from Advanced Micro Devices (AMD). These processors are designed to deliver unparalleled performance for HPC workloads, including scientific simulations, data analytics, and machine learning.\nThe Instinct lineup includes a range of processors, from the entry-level Inst"]} 

vLLM on a multi-accelerator system

1.   To use vLLM as an API server to serve reference requests, first start a container using the [vllm-rocm Docker image](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#fine-tuning-llms-vllm-rocm-docker-image).

docker run -it \
 --network=host \
 --group-add=video \
 --ipc=host \
 --cap-add=SYS_PTRACE \
 --security-opt seccomp=unconfined \
 --device /dev/kfd \
 --device /dev/dri \
 -v <path/to/model>:/app/model \
 vllm-rocm \
 bash 
2.   To run API server on multiple GPUs, use the `-tp` or `--tensor-parallel-size` parameter. For example, to use two GPUs, start the API server using the following command.

python -m vllm.entrypoints.api_server --model /app/model --dtype float16 -tp 2 --port 8000 & 
3.   To run multiple instances of API Servers, specify different ports for each server, and use `ROCR_VISIBLE_DEVICES` to isolate each instance to a different accelerator.

For example, to run two API servers, one on port 8000 using GPU 0 and 1, one on port 8001 using GPU 2 and 3, use a a command like the following.

ROCR_VISIBLE_DEVICES=0,1 python -m vllm.entrypoints.api_server --model /data/llama-2-7b-chat-hf --dtype float16 –tp 2 --port 8000 &
ROCR_VISIBLE_DEVICES=2,3 python -m vllm.entrypoints.api_server --model /data/llama-2-7b-chat-hf --dtype float16 –tp 2--port 8001 & 
4.   To test, send it a curl request containing a prompt.

curl http://localhost:8000/generate -H "Content-Type: application/json" -d '{"prompt": "What is AMD Instinct?", "max_tokens": 80, "temperature": 0.0 }' 
You should receive a response like the following.

{"text":["What is AMD Instinct?\nAmd Instinct is a brand new line of high-performance computing (HPC) processors from Advanced Micro Devices (AMD). These processors are designed to deliver unparalleled performance for HPC workloads, including scientific simulations, data analytics, and machine learning.\nThe Instinct lineup includes a range of processors, from the entry-level Inst"]} 

See also

See [vLLM performance optimization](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/workload.html#mi300x-vllm-optimization) for performance optimization tips.

ROCm provides a prebuilt optimized Docker image for validating the performance of LLM inference with vLLM on the MI300X accelerator. The Docker image includes ROCm, vLLM, and PyTorch. For more information, see vllm-benchmark.

Hugging Face TGI[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#fine-tuning-llms-tgi "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------

Text Generation Inference (TGI) is LLM serving framework from Hugging Face, and it also supports the majority of high-performance LLM acceleration algorithms such as Flash Attention, Paged Attention, CUDA/HIP graph, tensor parallel multi-GPU, GPTQ, AWQ, and token speculation.

### Install TGI[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html#install-tgi "Link to this heading")

1.   Launch the TGI Docker container in the host machine.

docker run --name tgi --rm -it --cap-add=SYS_PTRACE --security-opt seccomp=unconfined
--device=/dev/kfd --device=/dev/dri --group-add video --ipc=host --shm-size 256g
--net host -v $PWD:/data
--entrypoint "/bin/bash"
--env HUGGINGFACE_HUB_CACHE=/data
ghcr.io/huggingface/text-generation-inference:latest-rocm 

TGI on a single-accelerator system

1.   Inside the container, launch a model using TGI server on a single accelerator.

export ROCM_USE_FLASH_ATTN_V2_TRITON=True
text-generation-launcher --model-id NousResearch/Meta-Llama-3-70B --dtype float16 --port 8000 & 
2.   To test, send it a curl request containing a prompt.

curl http://localhost:8000/generate_stream -X POST -d '{"inputs":"What is AMD Instinct?","parameters":{"max_new_tokens":20}}' -H 'Content-Type: application/json' 
You should receive a response like the following.

data:{"index":20,"token":{"id":304,"text":" in","logprob":-1.2822266,"special":false},"generated_text":" AMD Instinct is a new family of data center GPUs designed to accelerate the most demanding workloads in","details":null} 

TGI on a multi-accelerator system

1.   Inside the container, launch a model using TGI server on multiple accelerators (4 in this case).

export ROCM_USE_FLASH_ATTN_V2_TRITON=True
text-generation-launcher --model-id NousResearch/Meta-Llama-3-8B --dtype float16 --port 8000 --num-shard 4 & 
2.   To test, send it a curl request containing a prompt.

curl http://localhost:8000/generate_stream -X POST -d '{"inputs":"What is AMD Instinct?","parameters":{"max_new_tokens":20}}' -H 'Content-Type: application/json' 
You should receive a response like the following.

data:{"index":20,"token":{"id":304,"text":" in","logprob":-1.2773438,"special":false},"generated_text":" AMD Instinct is a new family of data center GPUs designed to accelerate the most demanding workloads in","details":null}
