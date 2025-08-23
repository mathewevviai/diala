Title: Accelerator and GPU hardware specifications — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/reference/gpu-arch-specs.html

Published Time: Fri, 30 May 2025 19:28:24 GMT

Markdown Content:
Accelerator and GPU hardware specifications[#](https://rocm.docs.amd.com/en/latest/reference/gpu-arch-specs.html#accelerator-and-gpu-hardware-specifications "Link to this heading")
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-05-28

11 min read time

Applies to Linux and Windows

The following tables provide an overview of the hardware specifications for AMD Instinct™ accelerators, and AMD Radeon™ PRO and Radeon™ GPUs.

For more information about ROCm hardware compatibility, see the ROCm [Compatibility matrix](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html).

AMD Instinct accelerators

| Model | Architecture | LLVM target name | VRAM (GiB) | Compute Units | Wavefront Size | LDS (KiB) | L3 Cache (MiB) | L2 Cache (MiB) | L1 Vector Cache (KiB) | L1 Scalar Cache (KiB) | L1 Instruction Cache (KiB) | VGPR File (KiB) | SGPR File (KiB) | GFXIP Major version | GFXIP Minor version |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MI325X | CDNA3 | gfx942 | 256 | 304 (38 per XCD) | 64 | 64 | 256 | 32 (4 per XCD) | 32 | 16 per 2 CUs | 64 per 2 CUs | 512 | 12.5 | 9 | 4 |
| MI300X | CDNA3 | gfx942 | 192 | 304 (38 per XCD) | 64 | 64 | 256 | 32 (4 per XCD) | 32 | 16 per 2 CUs | 64 per 2 CUs | 512 | 12.5 | 9 | 4 |
| MI300A | CDNA3 | gfx942 | 128 | 228 (38 per XCD) | 64 | 64 | 256 | 24 (4 per XCD) | 32 | 16 per 2 CUs | 64 per 2 CUs | 512 | 12.5 | 9 | 4 |
| MI250X | CDNA2 | gfx90a | 128 | 220 (110 per GCD) | 64 | 64 |  | 16 (8 per GCD) | 16 | 16 per 2 CUs | 32 per 2 CUs | 512 | 12.5 | 9 | 0 |
| MI250 | CDNA2 | gfx90a | 128 | 208 (104 per GCD) | 64 | 64 |  | 16 (8 per GCD) | 16 | 16 per 2 CUs | 32 per 2 CUs | 512 | 12.5 | 9 | 0 |
| MI210 | CDNA2 | gfx90a | 64 | 104 | 64 | 64 |  | 8 | 16 | 16 per 2 CUs | 32 per 2 CUs | 512 | 12.5 | 9 | 0 |
| MI100 | CDNA | gfx908 | 32 | 120 | 64 | 64 |  | 8 | 16 | 16 per 3 CUs | 32 per 3 CUs | 256 VGPR and 256 AccVGPR | 12.5 | 9 | 0 |
| MI60 | GCN5.1 | gfx906 | 32 | 64 | 64 | 64 |  | 4 | 16 | 16 per 3 CUs | 32 per 3 CUs | 256 | 12.5 | 9 | 0 |
| MI50 (32GB) | GCN5.1 | gfx906 | 32 | 60 | 64 | 64 |  | 4 | 16 | 16 per 3 CUs | 32 per 3 CUs | 256 | 12.5 | 9 | 0 |
| MI50 (16GB) | GCN5.1 | gfx906 | 16 | 60 | 64 | 64 |  | 4 | 16 | 16 per 3 CUs | 32 per 3 CUs | 256 | 12.5 | 9 | 0 |
| MI25 | GCN5.0 | gfx900 | 16 | 64 | 64 | 64 |  | 4 | 16 | 16 per 3 CUs | 32 per 3 CUs | 256 | 12.5 | 9 | 0 |
| MI8 | GCN3.0 | gfx803 | 4 | 64 | 64 | 64 |  | 2 | 16 | 16 per 4 CUs | 32 per 4 CUs | 256 | 12.5 | 8 | 0 |
| MI6 | GCN4.0 | gfx803 | 16 | 36 | 64 | 64 |  | 2 | 16 | 16 per 4 CUs | 32 per 4 CUs | 256 | 12.5 | 8 | 0 |

AMD Radeon PRO GPUs

| Model | Architecture | LLVM target name | VRAM (GiB) | Compute Units | Wavefront Size | LDS (KiB) | Infinity Cache (MiB) | L2 Cache (MiB) | Graphics L1 Cache (KiB) | L0 Vector Cache (KiB) | L0 Scalar Cache (KiB) | L0 Instruction Cache (KiB) | VGPR File (KiB) | SGPR File (KiB) | GFXIP Major version | GFXIP Minor version |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Radeon AI PRO R9700 | RDNA4 | gfx1201 | 16 | 64 | 32 or 64 | 128 | 64 | 8 | N/A | 32 | 16 | 32 | 768 | 32 | 12 | 0 |
| Radeon PRO V710 | RDNA3 | gfx1101 | 28 | 54 | 32 or 64 | 128 | 56 | 4 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon PRO W7900 Dual Slot | RDNA3 | gfx1100 | 48 | 96 | 32 or 64 | 128 | 96 | 6 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon PRO W7900 | RDNA3 | gfx1100 | 48 | 96 | 32 or 64 | 128 | 96 | 6 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon PRO W7800 48GB | RDNA3 | gfx1100 | 48 | 70 | 32 or 64 | 128 | 96 | 6 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon PRO W7800 | RDNA3 | gfx1100 | 32 | 70 | 32 or 64 | 128 | 64 | 6 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon PRO W7700 | RDNA3 | gfx1101 | 16 | 48 | 32 or 64 | 128 | 64 | 4 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon PRO W6800 | RDNA2 | gfx1030 | 32 | 60 | 32 or 64 | 128 | 128 | 4 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon PRO W6600 | RDNA2 | gfx1032 | 8 | 28 | 32 or 64 | 128 | 32 | 2 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon PRO V620 | RDNA2 | gfx1030 | 32 | 72 | 32 or 64 | 128 | 128 | 4 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon Pro W5500 | RDNA | gfx1012 | 8 | 22 | 32 or 64 | 128 |  | 4 | 128 | 16 | 16 | 32 | 512 | 20 | 10 | 1 |
| Radeon Pro VII | GCN5.1 | gfx906 | 16 | 60 | 64 | 64 |  | 4 |  | 16 | 16 per 3 CUs | 32 per 3 CUs | 256 | 12.5 | 9 | 0 |

AMD Radeon GPUs

| Model | Architecture | LLVM target name | VRAM (GiB) | Compute Units | Wavefront Size | LDS (KiB) | Infinity Cache (MiB) | L2 Cache (MiB) | Graphics L1 Cache (KiB) | L0 Vector Cache (KiB) | L0 Scalar Cache (KiB) | L0 Instruction Cache (KiB) | VGPR File (KiB) | SGPR File (KiB) | GFXIP Major version | GFXIP Minor version |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Radeon RX 9070 XT | RDNA4 | gfx1201 | 16 | 64 | 32 or 64 | 128 | 64 | 8 | N/A | 32 | 16 | 32 | 768 | 32 | 12 | 0 |
| Radeon RX 9070 GRE | RDNA4 | gfx1201 | 16 | 48 | 32 or 64 | 128 | 48 | 6 | N/A | 32 | 16 | 32 | 768 | 32 | 12 | 0 |
| Radeon RX 9070 | RDNA4 | gfx1201 | 16 | 56 | 32 or 64 | 128 | 64 | 8 | N/A | 32 | 16 | 32 | 768 | 32 | 12 | 0 |
| Radeon RX 9060 XT | RDNA4 | gfx1200 | 16 | 32 | 32 or 64 | 128 | 32 | 4 | N/A | 32 | 16 | 32 | 768 | 32 | 12 | 0 |
| Radeon RX 7900 XTX | RDNA3 | gfx1100 | 24 | 96 | 32 or 64 | 128 | 96 | 6 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon RX 7900 XT | RDNA3 | gfx1100 | 20 | 84 | 32 or 64 | 128 | 80 | 6 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon RX 7900 GRE | RDNA3 | gfx1100 | 16 | 80 | 32 or 64 | 128 | 64 | 6 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon RX 7800 XT | RDNA3 | gfx1101 | 16 | 60 | 32 or 64 | 128 | 64 | 4 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon RX 7700 XT | RDNA3 | gfx1101 | 12 | 54 | 32 or 64 | 128 | 48 | 4 | 256 | 32 | 16 | 32 | 768 | 32 | 11 | 0 |
| Radeon RX 7600 | RDNA3 | gfx1102 | 8 | 32 | 32 or 64 | 128 | 32 | 2 | 256 | 32 | 16 | 32 | 512 | 32 | 11 | 0 |
| Radeon RX 6950 XT | RDNA2 | gfx1030 | 16 | 80 | 32 or 64 | 128 | 128 | 4 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6900 XT | RDNA2 | gfx1030 | 16 | 80 | 32 or 64 | 128 | 128 | 4 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6800 XT | RDNA2 | gfx1030 | 16 | 72 | 32 or 64 | 128 | 128 | 4 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6800 | RDNA2 | gfx1030 | 16 | 60 | 32 or 64 | 128 | 128 | 4 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6750 XT | RDNA2 | gfx1031 | 12 | 40 | 32 or 64 | 128 | 96 | 3 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6700 XT | RDNA2 | gfx1031 | 12 | 40 | 32 or 64 | 128 | 96 | 3 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6700 | RDNA2 | gfx1031 | 10 | 36 | 32 or 64 | 128 | 80 | 3 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6650 XT | RDNA2 | gfx1032 | 8 | 32 | 32 or 64 | 128 | 32 | 2 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6600 XT | RDNA2 | gfx1032 | 8 | 32 | 32 or 64 | 128 | 32 | 2 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon RX 6600 | RDNA2 | gfx1032 | 8 | 28 | 32 or 64 | 128 | 32 | 2 | 128 | 16 | 16 | 32 | 512 | 32 | 10 | 3 |
| Radeon VII | GCN5.1 | gfx906 | 16 | 60 | 64 | 64 per CU |  | 4 |  | 16 | 16 per 3 CUs | 32 per 3 CUs | 256 | 12.5 | 9 | 0 |

Glossary[#](https://rocm.docs.amd.com/en/latest/reference/gpu-arch-specs.html#glossary "Link to this heading")
--------------------------------------------------------------------------------------------------------------

For more information about the terms used, see the [specific documents and guides](https://rocm.docs.amd.com/en/latest/conceptual/gpu-arch.html#gpu-arch-documentation), or [Understanding the HIP programming model](https://rocm.docs.amd.com/projects/HIP/en/latest/understand/programming_model.html "(in HIP Documentation v6.4.43483)").

**LLVM target name**

Argument to pass to clang in `--offload-arch` to compile code for the given architecture.

**VRAM**

Amount of memory available on the GPU.

**Compute Units**

Number of compute units on the GPU.

**Wavefront Size**

Amount of work items that execute in parallel on a single compute unit. This is equivalent to the warp size in HIP.

**LDS**

The Local Data Share (LDS) is a low-latency, high-bandwidth scratch pad memory. It is local to the compute units, and can be shared by all work items in a work group. In HIP, the LDS can be used for shared memory, which is shared by all threads in a block.

**L3 Cache (CDNA/GCN only)**

Size of the level 3 cache. Shared by all compute units on the same GPU. Caches data and instructions. Similar to the Infinity Cache on RDNA architectures.

**Infinity Cache (RDNA only)**

Size of the infinity cache. Shared by all compute units on the same GPU. Caches data and instructions. Similar to the L3 Cache on CDNA/GCN architectures.

**L2 Cache**

Size of the level 2 cache. Shared by all compute units on the same GCD. Caches data and instructions.

**Graphics L1 Cache (RDNA only)**

An additional cache level that only exists in RDNA architectures. Local to a shader array.

**L1 Vector Cache (CDNA/GCN only)**

Size of the level 1 vector data cache. Local to a compute unit. This is the L0 vector cache in RDNA architectures.

**L1 Scalar Cache (CDNA/GCN only)**

Size of the level 1 scalar data cache. Usually shared by several compute units. This is the L0 scalar cache in RDNA architectures.

**L1 Instruction Cache (CDNA/GCN only)**

Size of the level 1 instruction cache. Usually shared by several compute units. This is the L0 instruction cache in RDNA architectures.

**L0 Vector Cache (RDNA only)**

Size of the level 0 vector data cache. Local to a compute unit. This is the L1 vector cache in CDNA/GCN architectures.

**L0 Scalar Cache (RDNA only)**

Size of the level 0 scalar data cache. Usually shared by several compute units. This is the L1 scalar cache in CDNA/GCN architectures.

**L0 Instruction Cache (RDNA only)**

Size of the level 0 instruction cache. Usually shared by several compute units. This is the L1 instruction cache in CDNA/GCN architectures.

**VGPR File**

Size of the Vector General Purpose Register (VGPR) file and. It holds data used in vector instructions. GPUs with matrix cores also have AccVGPRs, which are Accumulation General Purpose Vector Registers, used specifically in matrix instructions.

**SGPR File**

Size of the Scalar General Purpose Register (SGPR) file. Holds data used in scalar instructions.

**GFXIP**

GFXIP (Graphics IP) is a versioning system used by AMD to identify the GPU architecture and its instruction set. It helps categorize different generations of GPUs and their feature sets.

**GFXIP major version**

Defines the GPU’s core instruction set and architecture, which determines compatibility with software stacks such as HIP and OpenCL. For example, a GFXIP 11 major version corresponds to the RDNA 3 (Navi 3x) architecture, influencing driver support and available compute features.

**GFXIP minor version**

Represents specific variations within a GFXIP major version and affects feature sets, optimizations, and driver behavior in software stacks such as HIP and OpenCL. Different GPU models within the same major version can have unique capabilities, impacting performance and supported instructions.

**GCD**

Graphics Compute Die.

**XCD**

Accelerator Complex Die.
