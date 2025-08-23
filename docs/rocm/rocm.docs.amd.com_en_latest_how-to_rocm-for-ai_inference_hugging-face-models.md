Title: Running models from Hugging Face — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html

Markdown Content:
Contents
--------

*   [Using Hugging Face Transformers](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#using-hugging-face-transformers)
*   [Using Hugging Face with Optimum-AMD](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#using-hugging-face-with-optimum-amd)
    *   [Installation](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#installation)

*   [Flash Attention](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#flash-attention)
*   [GPTQ](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#gptq)
*   [ONNX](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#onnx)

Running models from Hugging Face[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#running-models-from-hugging-face "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-04-17

5 min read time

Applies to Linux

[Hugging Face](https://huggingface.co/) hosts the world’s largest AI model repository for developers to obtain transformer models. Hugging Face models and tools significantly enhance productivity, performance, and accessibility in developing and deploying AI solutions.

This section describes how to run popular community transformer models from Hugging Face on AMD accelerators and GPUs.

Using Hugging Face Transformers[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#using-hugging-face-transformers "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

First, [install the Hugging Face Transformers library](https://huggingface.co/docs/transformers/en/installation), which lets you easily import any of the transformer models into your Python application.

pip install transformers

Here is an example of running [GPT2](https://huggingface.co/openai-community/gpt2):

from transformers import GPT2Tokenizer, GPT2Model

tokenizer = GPT2Tokenizer.from_pretrained('gpt2')

model = GPT2Model.from_pretrained('gpt2')

text = "Replace me with any text you'd like."

encoded_input = tokenizer(text, return_tensors='pt')

output = model(**encoded_input)

Mainstream transformer models are regularly tested on supported hardware platforms. Models derived from those core models should also function correctly.

Here are some mainstream models to get you started:

*   [BERT](https://huggingface.co/bert-base-uncased)

*   [BLOOM](https://huggingface.co/bigscience/bloom)

*   [Llama](https://huggingface.co/huggyllama/llama-7b)

*   [OPT](https://huggingface.co/facebook/opt-66b)

*   [T5](https://huggingface.co/t5-base)

Using Hugging Face with Optimum-AMD[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#using-hugging-face-with-optimum-amd "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Optimum-AMD is the interface between Hugging Face libraries and the ROCm software stack.

For a deeper dive into using Hugging Face libraries on AMD accelerators and GPUs, refer to the [Optimum-AMD](https://huggingface.co/docs/optimum/main/en/amd/amdgpu/overview) page on Hugging Face for guidance on using Flash Attention 2, GPTQ quantization and the ONNX Runtime integration.

Hugging Face libraries natively support AMD Instinct accelerators. For other [ROCm-capable hardware](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html "(in ROCm installation on Linux v6.4.1)"), support is currently not validated, but most features are expected to work without issues.

### Installation[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#installation "Link to this heading")

Install Optimum-AMD using pip.

pip install --upgrade --upgrade-strategy eager optimum[amd]

Or, install from source.

git clone https://github.com/huggingface/optimum-amd.git
cd optimum-amd
pip install -e .

Flash Attention[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#flash-attention "Link to this heading")
----------------------------------------------------------------------------------------------------------------------------------------------------

1.   Use [the Hugging Face team’s example Dockerfile](https://github.com/huggingface/optimum-amd/blob/main/docker/transformers-pytorch-amd-gpu-flash/Dockerfile) to use Flash Attention with ROCm.

docker build -f Dockerfile -t transformers_pytorch_amd_gpu_flash .
volume=$PWD
docker run -it --network=host --device=/dev/kfd --device=/dev/dri --group-add=video --ipc=host --cap-add=SYS_PTRACE --security-opt seccomp=unconfined -v $volume:/workspace --name transformer_amd
transformers_pytorch_amd_gpu_flash:latest 
2.   Use Flash Attention 2 with [Transformers](https://huggingface.co/docs/transformers/perf_infer_gpu_one#flashattention-2) by adding the `use_flash_attention_2` parameter to `from_pretrained()`:

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, LlamaForCausalLM

tokenizer = AutoTokenizer.from_pretrained("tiiuae/falcon-7b")

with torch.device("cuda"):
  model = AutoModelForCausalLM.from_pretrained(
  "tiiuae/falcon-7b",
  torch_dtype=torch.float16,
  use_flash_attention_2=True,
  ) 

GPTQ[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#gptq "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------

To enable [GPTQ](https://arxiv.org/abs/2210.17323), hosted wheels are available for ROCm.

1.   First, [install Optimum-AMD](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#rocm-for-ai-install-optimum-amd).

2.   Install AutoGPTQ using pip. Refer to [AutoGPTQ Installation](https://github.com/AutoGPTQ/AutoGPTQ#Installation) for in-depth guidance.

pip install auto-gptq --no-build-isolation --extra-index-url https://huggingface.github.io/autogptq-index/whl/rocm573/ 
Or, to install from source for AMD accelerators supporting ROCm, specify the `ROCM_VERSION` environment variable.

ROCM_VERSION=6.1 pip install -vvv --no-build-isolation -e . 
3.   Load GPTQ-quantized models in Transformers using the backend [AutoGPTQ library](https://github.com/PanQiWei/AutoGPTQ):

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, LlamaForCausalLM

tokenizer = AutoTokenizer.from_pretrained("TheBloke/Llama-2-7B-Chat-GPTQ")

with torch.device("cuda"):
  model = AutoModelForCausalLM.from_pretrained(
  "TheBloke/Llama-2-7B-Chat-GPTQ",
  torch_dtype=torch.float16,
  ) 

ONNX[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/hugging-face-models.html#onnx "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------

Hugging Face Optimum also supports the [ONNX Runtime](https://onnxruntime.ai/) integration. For ONNX models, usage is straightforward.

1.   Specify the provider argument in the `ORTModel.from_pretrained()` method:

from optimum.onnxruntime import ORTModelForSequenceClassification
..
ort_model = ORTModelForSequenceClassification.from_pretrained(
..
provider="ROCMExecutionProvider"
) 
2.   Try running a [BERT text classification](https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english) ONNX model with ROCm:

from optimum.onnxruntime import ORTModelForSequenceClassification
from optimum.pipelines import pipeline
from transformers import AutoTokenizer
import onnxruntime as ort

session_options = ort.SessionOptions()

session_options.log_severity_level = 0

ort_model = ORTModelForSequenceClassification.from_pretrained(
   "distilbert-base-uncased-finetuned-sst-2-english",
   export=True,
   provider="ROCMExecutionProvider",
   session_options=session_options
   )

tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")

pipe = pipeline(task="text-classification", model=ort_model, tokenizer=tokenizer, device="cuda:0")

result = pipe("Both the music and visual were astounding, not to mention the actors performance.")
