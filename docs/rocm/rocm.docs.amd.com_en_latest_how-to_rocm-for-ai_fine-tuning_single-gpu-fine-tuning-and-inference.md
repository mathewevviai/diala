Title: Fine-tuning and inference using a single accelerator — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html

Markdown Content:
Fine-tuning and inference using a single accelerator[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#fine-tuning-and-inference-using-a-single-accelerator "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-04-17

12 min read time

Applies to Linux

This section explains model fine-tuning and inference techniques on a single-accelerator system. See [Multi-accelerator fine-tuning](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/multi-gpu-fine-tuning-and-inference.html) for a setup with multiple accelerators or GPUs.

Environment setup[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#environment-setup "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

This section was tested using the following hardware and software environment.

| Hardware | AMD Instinct MI300X accelerator |
| --- |
| Software | ROCm 6.1, Ubuntu 22.04, PyTorch 2.1.2, Python 3.10 |
| Libraries | `transformers``datasets``huggingface-hub``peft``trl``scipy` |
| Base model | `meta-llama/Llama-2-7b-chat-hf` |

### Setting up the base implementation environment[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#setting-up-the-base-implementation-environment "Link to this heading")

1.   Install PyTorch for ROCm. Refer to the [PyTorch installation guide](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/install/3rd-party/pytorch-install.html "(in ROCm installation on Linux v6.4.1)"). For a consistent installation, it’s recommended to use official ROCm prebuilt Docker images with the framework pre-installed.

2.   In the Docker container, check the availability of ROCm-capable accelerators using the following command.

rocm-smi --showproductname 
Your output should look like this:

============================ ROCm System Management Interface ============================
====================================== Product Info ======================================
GPU[0] : Card series: AMD Instinct MI300X OAM
GPU[0] : Card model: 0x74a1
GPU[0] : Card vendor: Advanced Micro Devices, Inc. [AMD/ATI]
GPU[0] : Card SKU: MI3SRIOV
==========================================================================================
================================== End of ROCm SMI Log =================================== 
3.   Check that your accelerators are available to PyTorch.

import torch
print("Is a ROCm-GPU detected? ", torch.cuda.is_available())
print("How many ROCm-GPUs are detected? ", torch.cuda.device_count()) 
If successful, your output should look like this:

>>> print("Is a ROCm-GPU detected? ", torch.cuda.is_available())
Is a ROCm-GPU detected? True
>>> print("How many ROCm-GPUs are detected? ", torch.cuda.device_count())
How many ROCm-GPUs are detected? 4 
4.   Install the required dependencies.

bitsandbytes is a library that facilitates quantization to improve the efficiency of deep learning models. Learn more about its use in [Model quantization techniques](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference-optimization/model-quantization.html).

See the [Optimizations for model fine-tuning](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/overview.html#fine-tuning-llms-concept-optimizations) for a brief discussion on PEFT and TRL.

# Install `bitsandbytes` for ROCm 6.0+.
# Use -DBNB_ROCM_ARCH to target a specific GPU architecture.
git clone --recurse https://github.com/ROCm/bitsandbytes.git
cd bitsandbytes
git checkout rocm_enabled_multi_backend
pip install -r requirements-dev.txt
cmake -DBNB_ROCM_ARCH="gfx942" -DCOMPUTE_BACKEND=hip -S .
python setup.py install

# To leverage the SFTTrainer in TRL for model fine-tuning.
pip install trl

# To leverage PEFT for efficiently adapting pre-trained language models .
pip install peft

# Install the other dependencies.
pip install transformers datasets huggingface-hub scipy 
5.   Check that the required packages can be imported.

import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments
)
from peft import LoraConfig
from trl import SFTTrainer 

### Download the base model and fine-tuning dataset[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#download-the-base-model-and-fine-tuning-dataset "Link to this heading")

1.   Request to access to download the [Meta’s official Llama model](https://huggingface.co/meta-llama) from Hugging Face. After permission is granted, log in with the following command using your personal access tokens:

huggingface-cli login 
2.   Run the following code to load the base model and tokenizer.

# Base model and tokenizer names.
base_model_name = "meta-llama/Llama-2-7b-chat-hf"

# Load base model to GPU memory.
device = "cuda:0"
base_model = AutoModelForCausalLM.from_pretrained(base_model_name, trust_remote_code = True).to(device)

# Load tokenizer.
tokenizer = AutoTokenizer.from_pretrained(
        base_model_name,
        trust_remote_code = True)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right" 
3.   Now, let’s fine-tune the base model for a question-and-answer task using a small dataset called [mlabonne/guanaco-llama2-1k](https://huggingface.co/datasets/mlabonne/guanaco-llama2-1k), which is a 1000 sample subset of the [timdettmers/openassistant-guanaco](https://huggingface.co/datasets/OpenAssistant/oasst1) dataset.

# Dataset for fine-tuning.
training_dataset_name = "mlabonne/guanaco-llama2-1k"
training_dataset = load_dataset(training_dataset_name, split = "train")

# Check the data.
print(training_dataset)

# Dataset 11 is a QA sample in English.
print(training_dataset[11]) 
4.   With the base model and the dataset, let’s start fine-tuning!

### Configure fine-tuning parameters[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#configure-fine-tuning-parameters "Link to this heading")

To set up `SFTTrainer` parameters, you can use the following code as reference.

# Training parameters for SFTTrainer.
training_arguments = TrainingArguments(
    output_dir = "./results",
         num_train_epochs = 1,
         per_device_train_batch_size = 4,
         gradient_accumulation_steps = 1,
         optim = "paged_adamw_32bit",
         save_steps = 50,
         logging_steps = 50,
         learning_rate = 4e-5,
         weight_decay = 0.001,
         fp16=False,
         bf16=False,
         max_grad_norm = 0.3,
         max_steps = -1,
         warmup_ratio = 0.03,
         group_by_length = True,
         lr_scheduler_type = "constant",
         report_to = "tensorboard"
)

Fine-tuning[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#fine-tuning "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------

In this section, you’ll see two ways of training: with the LoRA technique and without. See [Optimizations for model fine-tuning](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/overview.html#fine-tuning-llms-concept-optimizations) for an introduction to LoRA. Training with LoRA uses the `SFTTrainer` API with its PEFT integration. Training without LoRA forgoes these benefits.

Compare the number of trainable parameters and training time under the two different methodologies.

Fine-tuning with LoRA and PEFT

1.   Configure LoRA using the following code snippet.

peft_config = LoraConfig(
        lora_alpha = 16,
        lora_dropout = 0.1,
        r = 64,
        bias = "none",
        task_type = "CAUSAL_LM"
)
# View the number of trainable parameters.
from peft import get_peft_model
peft_model = get_peft_model(base_model, peft_config)
peft_model.print_trainable_parameters() 
The output should look like this. Compare the number of trainable parameters to that when fine-tuning without LoRA and PEFT.

trainable params: 33,554,432 || all params: 6,771,970,048 || trainable%: 0.49548996469513035 
2.   Initialize `SFTTrainer` with a PEFT LoRA configuration and run the trainer.

# Initialize an SFT trainer.
sft_trainer = SFTTrainer(
        model = base_model,
        train_dataset = training_dataset,
        peft_config = peft_config,
        dataset_text_field = "text",
        tokenizer = tokenizer,
        args = training_arguments
)

# Run the trainer.
sft_trainer.train() 
The output should look like this:

{'loss': 1.5973, 'grad_norm': 0.25271978974342346, 'learning_rate': 4e-05, 'epoch': 0.16}
{'loss': 2.0519, 'grad_norm': 0.21817368268966675, 'learning_rate': 4e-05, 'epoch': 0.32}
{'loss': 1.6147, 'grad_norm': 0.3046981394290924, 'learning_rate': 4e-05, 'epoch': 0.48}
{'loss': 1.4124, 'grad_norm': 0.11534837633371353, 'learning_rate': 4e-05, 'epoch': 0.64}
{'loss': 1.5627, 'grad_norm': 0.09108350425958633, 'learning_rate': 4e-05, 'epoch': 0.8}
{'loss': 1.417, 'grad_norm': 0.2536439299583435, 'learning_rate': 4e-05, 'epoch': 0.96}
{'train_runtime': 197.4947, 'train_samples_per_second': 5.063, 'train_steps_per_second': 0.633, 'train_loss': 1.6194254455566406, 'epoch': 1.0}
100%|██████████████████████████████████████████████████████████████████████████████████████████████████████| 125/125 [03:17<00:00, 1.58s/it] 

Fine-tuning without LoRA and PEFT

1.   Use the following code to get started.

def print_trainable_parameters(model):
    # Prints the number of trainable parameters in the model.
    trainable_params = 0
    all_param = 0
    for _, param in model.named_parameters():
        all_param += param.numel()
        if param.requires_grad:
            trainable_params += param.numel()
    print(f"trainable params: {trainable_params} || all params: {all_param} || trainable%: {100 * trainable_params / all_param:.2f}")

sft_trainer.peft_config = None
print_trainable_parameters(sft_trainer.model) 
The output should look like this. Compare the number of trainable parameters to that when fine-tuning with LoRA and PEFT.

trainable params: 6,738,415,616 || all params: 6,738,415,616 || trainable%: 100.00 
2.   Run the trainer.

# Trainer without LoRA config.
trainer_full = SFTTrainer(
        model = base_model,
        train_dataset = training_dataset,
        dataset_text_field = "text",
        tokenizer = tokenizer,
        args = training_arguments
)

# Training.
trainer_full.train() 
The output should look like this:

{'loss': 1.5975, 'grad_norm': 0.25113457441329956, 'learning_rate': 4e-05, 'epoch': 0.16}
{'loss': 2.0524, 'grad_norm': 0.2180655151605606, 'learning_rate': 4e-05, 'epoch': 0.32}
{'loss': 1.6145, 'grad_norm': 0.2949850261211395, 'learning_rate': 4e-05, 'epoch': 0.48}
{'loss': 1.4118, 'grad_norm': 0.11036080121994019, 'learning_rate': 4e-05, 'epoch': 0.64}
{'loss': 1.5595, 'grad_norm': 0.08962831646203995, 'learning_rate': 4e-05, 'epoch': 0.8}
{'loss': 1.4119, 'grad_norm': 0.25422757863998413, 'learning_rate': 4e-05, 'epoch': 0.96}
{'train_runtime': 419.5154, 'train_samples_per_second': 2.384, 'train_steps_per_second': 0.298, 'train_loss': 1.6171623611450194, 'epoch': 1.0}
100%|██████████████████████████████████████████████████████████████████████████████████████████████████████| 125/125 [06:59<00:00, 3.36s/it] 

### Saving adapters or fully fine-tuned models[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#saving-adapters-or-fully-fine-tuned-models "Link to this heading")

PEFT methods freeze the pre-trained model parameters during fine-tuning and add a smaller number of trainable parameters, namely the adapters, on top of it. The adapters are trained to learn specific task information. The adapters trained with PEFT are usually an order of magnitude smaller than the full base model, making them convenient to share, store, and load.

Saving a PEFT adapter

If you’re using LoRA and PEFT, use the following code to save a PEFT adapter to your system once the fine-tuning is completed.

# PEFT adapter name.
adapter_name = "llama-2-7b-enhanced-adapter"

# Save PEFT adapter.
sft_trainer.model.save_pretrained(adapter_name)

The saved PEFT adapter should look like this on your system:

# Access adapter directory.
cd llama-2-7b-enhanced-adapter

# List all adapter files.
README.md adapter_config.json adapter_model.safetensors

Saving a fully fine-tuned model

If you’re not using LoRA and PEFT so there is no PEFT LoRA configuration used for training, use the following code to save your fine-tuned model to your system.

# Fully fine-tuned model name.
new_model_name = "llama-2-7b-enhanced"

# Save the fully fine-tuned model.
full_trainer.model.save_pretrained(new_model_name)

The saved new full model should look like this on your system:

# Access new model directory.
cd llama-2-7b-enhanced

# List all model files.
config.json model-00002-of-00006.safetensors model-00005-of-00006.safetensors
generation_config.json model-00003-of-00006.safetensors model-00006-of-00006.safetensors
model-00001-of-00006.safetensors model-00004-of-00006.safetensors model.safetensors.index.json

Note

PEFT adapters can’t be loaded by `AutoModelForCausalLM` from the Transformers library as they do not contain full model parameters and model configurations, for example, `config.json`. To use it as a normal transformer model, you need to merge them into the base model.

Basic model inference[#](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/single-gpu-fine-tuning-and-inference.html#basic-model-inference "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

A trained model can be classified into one of three types:

*   A PEFT adapter

*   A pre-trained language model in Hugging Face

*   A fully fine-tuned model not using PEFT

Let’s look at achieving model inference using these types of models.

Inference using PEFT adapters

To use PEFT adapters like a normal transformer model, you can run the generation by loading a base model along with PEFT adapters as follows.

from peft import PeftModel
from transformers import AutoModelForCausalLM

# Set the path of the model or the name on Hugging face hub
base_model_name = "meta-llama/Llama-2-7b-chat-hf"

# Set the path of the adapter
adapter_name = "Llama-2-7b-enhanced-adpater"

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(base_model_name)

# Adapt the base model with the adapter
new_model = PeftModel.from_pretrained(base_model, adapter_name)

# Then, run generation as the same with a normal model outlined in 2.1

The PEFT library provides a `merge_and_unload` method, which merges the adapter layers into the base model. This is needed if someone wants to save the adapted model into local storage and use it as a normal standalone model.

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(base_model_name)

# Adapt the base model with the adapter
new_model = PeftModel.from_pretrained(base_model, adapter_name)

# Merge adapter
model = model.merge_and_unload()

# Save the merged model into local
model.save_pretrained("merged_adpaters")

Inference using pre-trained or fully fine-tuned models

If you have a fully fine-tuned model not using PEFT, you can load it like any other pre-trained language model in [Hugging Face Hub](https://huggingface.co/docs/hub/en/index) using the [Transformers](https://huggingface.co/docs/transformers/en/index) library.

# Import relevant class for loading model and tokenizer
from transformers import AutoTokenizer, AutoModelForCausalLM

# Set the pre-trained model name on Hugging face hub
model_name = "meta-llama/Llama-2-7b-chat-hf"

# Set device type
device = "cuda:0"

# Load model and tokenizer
model = AutoModelForCausalLM.from_pretrained(model_name).to(device)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Input prompt encoding
query = "What is a large language model?"
inputs = tokenizer.encode(query, return_tensors="pt").to(device)

# Token generation
outputs = model.generate(inputs)

# Outputs decoding
print(tokenizer.decode(outputs[0]))

In addition, pipelines from Transformers offer simple APIs to use pre-trained models for different tasks, including sentiment analysis, feature extraction, question answering and so on. You can use the pipeline abstraction to achieve model inference easily.

# Import relevant class for loading model and tokenizer
from transformers import pipeline

# Set the path of your model or the name on Hugging face hub
model_name_or_path = "meta-llama/Llama-2-7b-chat-hf"

# Set pipeline
# A positive device value will run the model on associated CUDA device id
pipe = pipeline("text-generation", model=model_name_or_path, device=0)

# Token generation
print(pipe("What is a large language model?")[0]["generated_text"])

If using multiple accelerators, see [Multi-accelerator fine-tuning and inference](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/fine-tuning/multi-gpu-fine-tuning-and-inference.html#fine-tuning-llms-multi-gpu-hugging-face-accelerate) to explore popular libraries that simplify fine-tuning and inference in a multi-accelerator system.

Read more about inference frameworks like vLLM and Hugging Face TGI in [LLM inference frameworks](https://rocm.docs.amd.com/en/latest/how-to/rocm-for-ai/inference/llm-inference-frameworks.html).
