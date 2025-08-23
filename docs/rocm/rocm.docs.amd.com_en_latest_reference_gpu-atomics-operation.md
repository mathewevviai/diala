Title: Hardware atomics operation support — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html

Markdown Content:
Hardware atomics operation support[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#hardware-atomics-operation-support "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-04-17

148 min read time

Applies to Linux and Windows

[Atomic operations](https://rocm.docs.amd.com/projects/HIP/en/latest/how-to/hip_cpp_language_extensions.html#atomic-functions "(in HIP Documentation v6.4.43483)") guarantee that the operation is completed as an indivisible unit, preventing race conditions where simultaneous access to the same memory location could lead to incorrect or undefined behavior.

This document details the various support of atomic read-modify-write (atomicRMW) operations on gfx9, gfx10, gfx11, gfx12, MI100, MI200 and MI300 AMD GPUs. The atomics operation type behavior effected by the memory locations, memory granularity or scope of operations.

Memory locations:

*   [Device memory](https://rocm.docs.amd.com/projects/HIP/en/latest/how-to/hip_runtime_api/memory_management/device_memory.html#device-memory "(in HIP Documentation v6.4.43483)"), i.e. VRAM, the RAM on a discrete GPU device or in framebuffer carveout for APUs. This includes peer-device memory within an Infinity Fabric™ hive.

*   [Host memory](https://rocm.docs.amd.com/projects/HIP/en/latest/how-to/hip_runtime_api/memory_management/host_memory.html#host-memory "(in HIP Documentation v6.4.43483)"): in DRAM associated with the CPU (or peer device memory using PCIe® (PCI Express) peer-to-peer). This can be two sub-types:

    *   Migratable memory: memory that is currently residing in host DRAM, but which can be migrated back to device memory. For example, `hipMallocManaged()` or [unified memory](https://rocm.docs.amd.com/projects/HIP/en/latest/how-to/hip_runtime_api/memory_management/unified_memory.html#unified-memory "(in HIP Documentation v6.4.43483)") allocations.

    *   [Pinned memory](https://rocm.docs.amd.com/projects/HIP/en/latest/how-to/hip_runtime_api/memory_management/host_memory.html#pinned-host-memory "(in HIP Documentation v6.4.43483)"): memory that is in host memory and cannot be migrated to the device (not necessarily pinned to a particular physical address, but can’t be moved to device memory). `hipHostMalloc()`, for example.

Memory granularity or [coherence](https://rocm.docs.amd.com/projects/HIP/en/latest/how-to/hip_runtime_api/memory_management/coherence_control.html#coherence-control "(in HIP Documentation v6.4.43483)"):

*   Coarse-grained memory

    *   This memory can be used for device-scope synchronization during the execution of a single GPU kernel. Any system-scope atomics sent to this type of memory will not achieve system-scope coherency and will instead be downgraded to device-scope as per the programming model.

    *   This type of memory only available on AMD GPUs.

*   Fine-grained memory

    *   This memory can be used for device and system-scope synchronization during the execution of a single GPU kernel.

Scopes of operations:

*   Device-scope or agent-scope

    *   This atomic should happen atomically from the point of view of every thread within the device that the atomic-executing thread is in.

*   System-scope

    *   This atomic should happen atomically from the point of view of every thread in all devices and in the CPUs.

Support summary[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#support-summary "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------

AMD Instinct™ accelerators[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#amd-instinct-accelerators "Link to this heading")
--------------------------------------------------------------------------------------------------------------------------------------------------------

**MI300**

*   All atomicRMW operations are forwarded out to the Infinity Fabric.

*   Infinity Fabric supports common integer and bitwise atomics, FP32 atomic add, packed-FP16 atomic add, packed-BF16 atomic add, and FP64 add, min, and max.

*   In discrete GPUs (dGPUs), if the data is stored in host memory, the atomic will be forwarded from the Infinity Fabric to PCIe.

*   If the PCIe bus does not support the requested atomic, the GPU’s PCIe controller changes it into a load-op-store sequence. All waves on the chip submitting atomics to that address will stall waiting for the load-op-store. It will seem like atomics to the wave, but the CPU sees it as a non-atomic load-op-store sequence. This downgrades system-scope atomics to device-scope.

**MI200**

*   L2 cache and Infinity Fabric both support common integer and bitwise atomics.

*   L2 cache supports FP32 atomic add, packed-FP16 atomic add, and FP64 add, min, and max.

*   The Infinity Fabric does not support FP32 atomic add, packed-FP16 atomic add, and FP64 add, min, and max atomics and these commands cannot be sent to the Infinity Fabric.

*   Coarse-grained memory is marked as cacheable, and atomic operations will be processed in the L2 cache.

*   Fine-grained memory is marked write-uncacheable through the page tables.

*   Atomics that hit write-uncached memory are forwarded to the Infinity Fabric.

*   If the uncached data is stored in host memory on a PCIe system, the atomic will be forwarded from Infinity Fabric to PCIe. Any atomic not supported by the PCIe bus will be a NOP and give incorrect result.

*   If the uncached data is stored in host memory on an A+A system (system with AMD CPU and AMD GPU connected via Infinity Fabric), the atomic operation will be forwarded to the remote location and will succeed if supported by Infinity Fabric.

*   If the float atomics access write-uncached memory, they cannot be forwarded to the Infinity Fabric, resulting in a NOP and an incorrect outcome.

**MI100**

*   L2 cache and Infinity Fabric both support common integer and bitwise atomics.

*   L2 cache supports no returns (NoReturn) versions of packed-FP16 and FP32 atomic adds, that cannot return data.

*   The Infinity Fabric does not support packed-FP16 or FP32 atomic adds, preventing these commands from being transmitted through it.

*   Coarse-grained memory is marked as cacheable, and atomic operations will be processed in the L2 cache.

*   Fine-grained memory is marked uncacheable through the page tables.

*   Atomics that hit uncached memory are forwarded to the Infinity Fabric.

*   If the uncached data is stored in host memory, the atomic will be forwarded from Infinity Fabric to PCIe. Any atomic not supported by the PCIe bus will be a NOP and give incorrect result.

*   If an float atomic add hits uncached memory, it cannot be forwarded to the Infinity Fabric so it will NOP and give incorrect result.

AMD gfx generic targets[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#amd-gfx-generic-targets "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------

**gfx9**

*   L2 cache and Infinity Fabric both support common integer and bitwise atomics.

*   Coarse-grained memory is marked as cacheable, and atomic operations will be processed in the L2 cache.

*   Fine-grained memory is marked uncacheable through the page tables.

*   Atomics that hit uncached memory are forwarded to the Infinity Fabric.

*   In a dGPU: if the uncached data is stored in host memory, the atomic will be forwarded from Infinity Fabric to PCIe. Any atomic not supported by the PCIe bus will be a NOP and.

**gfx10**

*   L2 cache and Infinity Fabric both support common integer and bitwise atomics.

*   Coarse-grained memory is marked as cacheable, and atomic operations will be processed in the L2 cache.

*   Fine-grained memory is marked uncacheable through the page tables.

*   Atomics that hit uncached memory are forwarded to the Infinity Fabric.

*   In a dGPU: if the uncached data is stored in host memory, the atomic will be forwarded from Infinity Fabric to PCIe. Any atomic not supported by the PCIe bus will be a NOP and give incorrect result.

*   Supports floating-point atomic min/max.

*   The Infinity Fabric does not support floating-point atomic min/max atomics and these commands cannot be sent to the Infinity Fabric.

*   If the floating-point atomics hit uncached memory, they cannot be forwarded to the Infinity Fabric, so they will NOP and give incorrect result.

**gfx11**

*   L2 cache and Infinity Fabric both support common integer and bitwise atomics.

*   L2 cache supports FP32 atomic add, min and max.

*   The Infinity Fabric does not support FP32 atomic add, min and max atomics and these commands cannot be sent to the Infinity Fabric.

*   Coarse-grained memory is marked as cacheable, and atomic operations will be processed in the L2 cache.

*   Fine-grained memory is marked uncacheable through the page tables.

*   Atomics that hit write-uncached memory are forwarded to the Infinity Fabric.

*   In a dGPU: if the uncached data is stored in host memory, the atomic will be forwarded from Infinity Fabric to PCIe. Any atomic not supported by the PCIe bus will be a NOP and give incorrect result.

*   If the float atomics hit uncached memory, they cannot be forwarded to the Infinity Fabric, so they will NOP and give incorrect result.

**gfx12**

*   L2 cache and Infinity Fabric both support common integer and bitwise atomics.

*   L2 cache and Infinity Fabric both also support FP32 atomic add, min and max, and packed-FP16 atomic add, and packed-BF16 atomic add.

*   Coarse-grained memory is marked as cacheable, and atomic operations will be processed in the L2 cache.

*   Fine-grained device memory is marked uncacheable through the page tables.

    *   Atomics that hit write-uncached memory are forwarded to the Infinity Fabric.

*   Fine-grained system memory is marked as cacheable through the page tables.

    *   Device-scope atomic operations will process in the L2 cache.

    *   System-scope atomic operations will bypass the L2 cache and be forwarded to the Infinity Fabric.

*   Atomics that hit write-uncached memory are forwarded to the Infinity Fabric.

*   In dGPUs, if the data is stored in host memory, the atomic will be forwarded from the Infinity Fabric to PCIe.

*   If the PCIe bus does not support the requested atomic, the GPU’s PCIe controller changes it into a load-op-store sequence. All waves on the chip submitting atomics to that address will stall waiting for the load-op-store. It will seem like atomics to the wave, but the CPU sees it as a non-atomic load-op-store sequence. This downgrades system-scope atomics to device-scope.

GPUs atomics support[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#gpus-atomics-support "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------

This section presents a series of tables that show the level of atomic operations support for the different hardware devices described above, and different datatypes, different operations and different scopes.

Hardware atomics support refers to the ability of GPUs to natively perform atomic operations—special low-level operations that ensure data consistency when multiple threads access and modify memory concurrently.

CAS (Compare-and-Swap) atomic support refers to the hardware or software capability to perform an atomic Compare-and-Swap operation.

PCIe atomics are a feature of the PCIe interface that enable atomic operations between devices and hosts across the PCIe bus. For further information, please check [How ROCm uses PCIe atomics](https://instinct.docs.amd.com/projects/amdgpu-docs/en/latest/conceptual/pcie-atomics.html).

The tables that follow show the correctness of atomics operations on the hardware using the following notations:

*   ✅: Produces the correct answer.

*   ⚠️: Produces the correct answer, but works only at a weaker scope.

*   ❌: The atomics operation fails.

The tables show the different types of atomic operations used by specific devices:

*   Native: Computes the correct result using a hardware-native atomic instruction.

*   CAS: Generates the correct result, but the atomic operation is implemented by the compiler for this ISA using a compare-and-swap emulation loop.

*   ✅ NoReturn: Produces the correct correct result but does not precisely conform to the atomic API.

*   Scope Downgrade: Generates the correct result but operates at a weaker scope than requested. For example, if a user specifies a system-scope atomic, the operation may only function at the device scope.

*   NOP: The atomic operation is not executed on the target location, and the requesting thread receives back 0 as a return value.

*   n/a: The atomic type is not supported and cannot be executed on the specific hardware.

The tables selectors or options are the following:

*   Highest level option:

    *   “HW atomics”, where software attempts to use hardware atomics.

    *   “CAS emulation”, where software attempts to use CAS emulation.

*   Second-level option:

    *   “No PCIe atomics” means the system does not support PCIe atomics between the accelerator and peer/host-memory.

    *   “PCIe atomics” means the system supports PCIe atomics between the accelerator and peer/host-memory.

*   The third-level option is the memory granularity of the memory target.

*   The final option is the scope of atomic access.

Integer atomics operations[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#integer-atomics-operations "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------

The integer type atomic operations that are supported by different hardware.

*   32 bit integer

    *   Add

    *   Subtract

    *   Min

    *   Max

    *   IncDec

*   64 bit integer

    *   Add

    *   Min

    *   Max

### AMD Instinct accelerators[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#id1 "Link to this heading")

The integer type atomic operations that are supported by different AMD Instinct accelerators listed in the following table.

HW atomics

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

CAS emulation

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicSub | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicInc | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicDec | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

### AMD gfx generic targets[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#id2 "Link to this heading")

The integer type atomic operations that are supported by different gfx generic targets listed in the following table.

HW atomics

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicAdd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicInc | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicDec | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMax | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicSub | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicInc | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicDec | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicAdd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicMin | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicMax | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

CAS emulation

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicSub | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicInc | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicDec | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicSub | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicInc | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicDec | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicSub | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicInc | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicDec | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Bitwise atomics operations[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#bitwise-atomics-operations "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------

The bitwise atomic operations that are supported by different hardware.

*   32 bit bitwise

    *   Exchange

    *   Compare-and-Swap (CAS)

    *   AND

    *   OR

    *   XOR

*   64 bit bitwise

    *   Exchange

    *   CAS

    *   AND

    *   OR

    *   XOR

Note

128-bit bitwise Exchange and CAS are not supported on AMD GPUs

### AMD Instinct accelerators[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#id3 "Link to this heading")

The bitwise atomic operations that are supported by different AMD Instinct accelerators listed in the following table.

HW atomics

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade | ✅ Native |

CAS emulation

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ CAS |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ CAS |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicExch | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicCAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicOr | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit atomicXor | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

### AMD gfx generic targets[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#id4 "Link to this heading")

The bitwise atomic operations that are supported by different AMD gfx generic targets listed in the following table.

HW atomics

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicExch | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicOr | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicXor | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 32 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicExch | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicOr | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicXor | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |

CAS emulation

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicExch | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicCAS | ❌ NOP | ✅ Native | ❌ NOP | ❌ NOP | ✅ Native | ⚠️ Scope Downgrade |
| 64 bit atomicAnd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicOr | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit atomicXor | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit atoimcExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicExch | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicCAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit atomicAnd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicOr | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit atomicXor | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Float atomics operations[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#float-atomics-operations "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------------------

The float types atomic operations that are supported by different hardware.

*   32-bit IEEE 754 floating point (‘single precision’, FP32)

    *   Add

    *   Min

    *   Max

*   64-bit IEEE 754 floating point (‘double precision’, FP64)

    *   Add

    *   Min

    *   Max

*   16-bit IEEE 754 floating point (‘half precision”, FP16)

    *   Add

*   2xPacked 16-bit IEEE 754 floating point (‘half precision’, FP16)

    *   Add

*   BrainFloat-16 floating point (BF16)

    *   Add

*   2xPacked BrainFloat-16 floating point (BF16)

    *   Add

### AMD Instinct accelerators[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#id5 "Link to this heading")

The float type atomic operations that are supported by different AMD Instinct accelerators listed in the following table.

HW atomics

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade | ✅ Native |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade | ✅ Native |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ⚠️ Scope Downgrade | ✅ Native |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ✅ NoReturn | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMin | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 64 bit float atomicMax | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ⚠️ Scope Downgrade | ✅ Native |

CAS emulation

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade - CAS | ✅ CAS |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | MI100 | MI200 PCIe | MI200 A+A | MI300X | MI300A |
| --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

### AMD gfx generic targets[#](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#id6 "Link to this heading")

The float types atomic operations that are supported by different AMD gfx generic targets listed in the following table.

HW atomics

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | n/a | n/a | n/a | n/a | n/a | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ⚠️ Scope Downgrade |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ⚠️ Scope Downgrade |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ Native | ✅ Native | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ Native | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ✅ Native |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ Native |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ❌ NOP | ❌ NOP | ⚠️ Scope Downgrade |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ❌ NOP | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ⚠️ Scope Downgrade |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ⚠️ Scope Downgrade |

CAS emulation

No PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 32 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMin | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 64 bit float atomicMax | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 16bx2 half2 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |
| 16bx2 bfloat162 atomicAdd | ❌ NOP | ✅ CAS | ❌ NOP | ❌ NOP | ✅ CAS | ⚠️ Scope Downgrade - CAS |

PCIe atomics

Device DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Migratable Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Pinned Host DRAM

Coarse-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

Fine-grained

Device

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |

System

| Atomic | gfx9 dGPU | gfx9 APU | gfx10 dGPU | gfx11 dGPU | gfx11 APU | gfx12 dGPU |
| --- | --- | --- | --- | --- | --- | --- |
| 32 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 32 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMin | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 64 bit float atomicMax | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 half2 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
| 16bx2 bfloat162 atomicAdd | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS | ✅ CAS |
