Title: Data types and precision support — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/reference/precision-support.html

Markdown Content:
Contents
--------

*   [Integral types](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#integral-types)
*   [Floating-point types](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#floating-point-types)
*   [Level of support definitions](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#level-of-support-definitions)
*   [Data type support by Hardware Architecture](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#data-type-support-by-hardware-architecture)
    *   [Compute units support](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#compute-units-support)
    *   [Matrix core support](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#matrix-core-support)
    *   [Atomic operations support](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#atomic-operations-support)

*   [Data type support in ROCm libraries](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#data-type-support-in-rocm-libraries)
    *   [Libraries input/output type support](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#libraries-input-output-type-support)
    *   [Libraries internal calculations type support](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#libraries-internal-calculations-type-support)

Data types and precision support[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#data-types-and-precision-support "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-04-17

7 min read time

Applies to Linux and Windows

This topic lists the data types support on AMD GPUs, ROCm libraries along with corresponding [HIP](https://rocm.docs.amd.com/projects/HIP/en/latest/index.html "(in HIP Documentation v6.4.43483)") data types.

Integral types[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#integral-types "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------

The signed and unsigned integral types supported by ROCm are listed in the following table.

| Type name | HIP type | Description |
| --- | --- | --- |
| int8 | `int8_t`, `uint8_t` | A signed or unsigned 8-bit integer |
| int16 | `int16_t`, `uint16_t` | A signed or unsigned 16-bit integer |
| int32 | `int32_t`, `uint32_t` | A signed or unsigned 32-bit integer |
| int64 | `int64_t`, `uint64_t` | A signed or unsigned 64-bit integer |

Floating-point types[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#floating-point-types "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------

The floating-point types supported by ROCm are listed in the following table.

![Image 1: Supported floating-point types](https://rocm.docs.amd.com/en/latest/_images/floating-point-data-types.png)

| Type name | HIP type | Description |
| --- | --- | --- |
| float8 (E4M3) | `__hip_fp8_e4m3_fnuz` | An 8-bit floating-point number that mostly follows IEEE-754 conventions and **S1E4M3** bit layout, as described in [8-bit Numerical Formats for Deep Neural Networks](https://arxiv.org/abs/2206.02915), with expanded range and no infinity or signed zero. NaN is represented as negative zero. |
| float8 (E5M2) | `__hip_fp8_e5m2_fnuz` | An 8-bit floating-point number mostly following IEEE-754 conventions and **S1E5M2** bit layout, as described in [8-bit Numerical Formats for Deep Neural Networks](https://arxiv.org/abs/2206.02915), with expanded range and no infinity or signed zero. NaN is represented as negative zero. |
| float16 | `half` | A 16-bit floating-point number that conforms to the IEEE 754-2008 half-precision storage format. |
| bfloat16 | `bfloat16` | A shortened 16-bit version of the IEEE 754 single-precision storage format. |
| tensorfloat32 | Not available | A floating-point number that occupies 32 bits or less of storage, providing improved range compared to half (16-bit) format, at (potentially) greater throughput than single-precision (32-bit) formats. |
| float32 | `float` | A 32-bit floating-point number that conforms to the IEEE 754 single-precision storage format. |
| float64 | `double` | A 64-bit floating-point number that conforms to the IEEE 754 double-precision storage format. |

Note

*   The float8 and tensorfloat32 types are internal types used in calculations in Matrix Cores and can be stored in any type of the same size.

*   The encodings for FP8 (E5M2) and FP8 (E4M3) that the MI300 series natively supports differ from the FP8 (E5M2) and FP8 (E4M3) encodings used in NVIDIA H100 ([FP8 Formats for Deep Learning](https://arxiv.org/abs/2209.05433)).

*   In some AMD documents and articles, float8 (E5M2) is referred to as bfloat8.

*   The [low precision floating point types page](https://rocm.docs.amd.com/projects/HIP/en/latest/reference/low_fp_types.html "(in HIP Documentation v6.4.43483)") describes how to use these types in HIP with examples.

Level of support definitions[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#level-of-support-definitions "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------

In the following sections, icons represent the level of support. These icons, described in the following table, are also used in the library data type support pages.

| Icon | Definition |
| --- | --- |
| NA | Not applicable |
| ❌ | Not supported |
| ⚠️ | Partial support |
| ✅ | Full support |

Note

*   Full support means that the type is supported natively or with hardware emulation.

*   Native support means that the operations for that type are implemented in hardware. Types that are not natively supported are emulated with the available hardware. The performance of non-natively supported types can differ from the full instruction throughput rate. For example, 16-bit integer operations can be performed on the 32-bit integer ALUs at full rate; however, 64-bit integer operations might need several instructions on the 32-bit integer ALUs.

*   Any type can be emulated by software, but this page does not cover such cases.

Data type support by Hardware Architecture[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#data-type-support-by-hardware-architecture "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

The MI200 series GPUs, which include MI210, MI250, and MI250X, are based on the CDNA2 architecture. The MI300 series GPUs, consisting of MI300A, MI300X, and MI325X, are based on the CDNA3 architecture.

### Compute units support[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#compute-units-support "Link to this heading")

The following table lists data type support for compute units.

Integral types

| Type name | int8 | int16 | int32 | int64 |
| --- | --- | --- | --- | --- |
| MI100 | ✅ | ✅ | ✅ | ✅ |
| MI200 series | ✅ | ✅ | ✅ | ✅ |
| MI300 series | ✅ | ✅ | ✅ | ✅ |

Floating-point types

| Type name | float8 (E4M3) | float8 (E5M2) | float16 | bfloat16 | tensorfloat32 | float32 | float64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MI100 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| MI200 series | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| MI300 series | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |

### Matrix core support[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#matrix-core-support "Link to this heading")

The following table lists data type support for AMD GPU matrix cores.

Integral types

| Type name | int8 | int16 | int32 | int64 |
| --- | --- | --- | --- | --- |
| MI100 | ✅ | ❌ | ❌ | ❌ |
| MI200 series | ✅ | ❌ | ❌ | ❌ |
| MI300 series | ✅ | ❌ | ❌ | ❌ |

Floating-point types

| Type name | float8 (E4M3) | float8 (E5M2) | float16 | bfloat16 | tensorfloat32 | float32 | float64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MI100 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| MI200 series | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| MI300 series | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Atomic operations support[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#atomic-operations-support "Link to this heading")

The following table lists which data types are supported for atomic operations on AMD GPUs. The atomics operation type behavior is affected by the memory locations, memory granularity, or scope of operations. For detailed various support of atomic read-modify-write (atomicRMW) operations collected on the [Hardware atomics operation support](https://rocm.docs.amd.com/en/latest/reference/gpu-atomics-operation.html#hw-atomics-operation-support) page.

Integral types

| Type name | int8 | int16 | int32 | int64 |
| --- | --- | --- | --- | --- |
| MI100 | ❌ | ❌ | ✅ | ✅ |
| MI200 series | ❌ | ❌ | ✅ | ✅ |
| MI300 series | ❌ | ❌ | ✅ | ✅ |

Floating-point types

| Type name | float8 (E4M3) | float8 (E5M2) | 2 x float16 | 2 x bfloat16 | tensorfloat32 | float32 | float64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MI100 | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| MI200 series | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| MI300 series | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |

Note

You can emulate atomic operations using software for cases that are not natively supported. Software-emulated atomic operations have a high negative performance impact when they frequently access the same memory address.

Data type support in ROCm libraries[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#data-type-support-in-rocm-libraries "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

ROCm library support for int8, float8 (E4M3), float8 (E5M2), int16, float16, bfloat16, int32, tensorfloat32, float32, int64, and float64 is listed in the following tables.

### Libraries input/output type support[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#libraries-input-output-type-support "Link to this heading")

The following tables list ROCm library support for specific input and output data types. Refer to the corresponding library data type support page for a detailed description.

Integral types

| Library input/output data type name | int8 | int16 | int32 | int64 |
| --- | --- | --- | --- | --- |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/reference/data-type-support.html "(in hipSPARSELt Documentation v0.2.3)") | ✅/✅ | ❌/❌ | ❌/❌ | ❌/❌ |
| [rocRAND](https://rocm.docs.amd.com/projects/rocRAND/en/latest/api-reference/data-type-support.html "(in rocRAND Documentation v3.3.0)") | NA/✅ | NA/✅ | NA/✅ | NA/✅ |
| [hipRAND](https://rocm.docs.amd.com/projects/hipRAND/en/latest/api-reference/data-type-support.html "(in hipRAND Documentation v2.12.0)") | NA/✅ | NA/✅ | NA/✅ | NA/✅ |
| [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/latest/reference/data-type-support.html "(in rocPRIM Documentation v3.4.0)") | ✅/✅ | ✅/✅ | ✅/✅ | ✅/✅ |
| [hipCUB](https://rocm.docs.amd.com/projects/hipCUB/en/latest/api-reference/data-type-support.html "(in hipCUB Documentation v3.4.0)") | ✅/✅ | ✅/✅ | ✅/✅ | ✅/✅ |
| [rocThrust](https://rocm.docs.amd.com/projects/rocThrust/en/latest/data-type-support.html "(in rocThrust Documentation v3.3.0)") | ✅/✅ | ✅/✅ | ✅/✅ | ✅/✅ |

Floating-point types

| Library input/output data type name | float8 (E4M3) | float8 (E5M2) | float16 | bfloat16 | tensorfloat32 | float32 | float64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/reference/data-type-support.html "(in hipSPARSELt Documentation v0.2.3)") | ❌/❌ | ❌/❌ | ✅/✅ | ✅/✅ | ❌/❌ | ❌/❌ | ❌/❌ |
| [rocRAND](https://rocm.docs.amd.com/projects/rocRAND/en/latest/api-reference/data-type-support.html "(in rocRAND Documentation v3.3.0)") | NA/❌ | NA/❌ | NA/✅ | NA/❌ | NA/❌ | NA/✅ | NA/✅ |
| [hipRAND](https://rocm.docs.amd.com/projects/hipRAND/en/latest/api-reference/data-type-support.html "(in hipRAND Documentation v2.12.0)") | NA/❌ | NA/❌ | NA/✅ | NA/❌ | NA/❌ | NA/✅ | NA/✅ |
| [rocPRIM](https://rocm.docs.amd.com/projects/rocPRIM/en/latest/reference/data-type-support.html "(in rocPRIM Documentation v3.4.0)") | ❌/❌ | ❌/❌ | ✅/✅ | ✅/✅ | ❌/❌ | ✅/✅ | ✅/✅ |
| [hipCUB](https://rocm.docs.amd.com/projects/hipCUB/en/latest/api-reference/data-type-support.html "(in hipCUB Documentation v3.4.0)") | ❌/❌ | ❌/❌ | ✅/✅ | ✅/✅ | ❌/❌ | ✅/✅ | ✅/✅ |
| [rocThrust](https://rocm.docs.amd.com/projects/rocThrust/en/latest/data-type-support.html "(in rocThrust Documentation v3.3.0)") | ❌/❌ | ❌/❌ | ⚠️/⚠️ | ⚠️/⚠️ | ❌/❌ | ✅/✅ | ✅/✅ |

Note

As random number generation libraries, rocRAND and hipRAND only specify output data types for the random values they generate, with no need for input data types.

### Libraries internal calculations type support[#](https://rocm.docs.amd.com/en/latest/reference/precision-support.html#libraries-internal-calculations-type-support "Link to this heading")

The following tables list ROCm library support for specific internal data types. Refer to the corresponding library data type support page for a detailed description.

Integral types

| Library internal data type name | int8 | int16 | int32 | int64 |
| --- | --- | --- | --- | --- |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/reference/data-type-support.html "(in hipSPARSELt Documentation v0.2.3)") | ❌ | ❌ | ✅ | ❌ |

Floating-point types

| Library internal data type name | float8 (E4M3) | float8 (E5M2) | float16 | bfloat16 | tensorfloat32 | float32 | float64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [hipSPARSELt](https://rocm.docs.amd.com/projects/hipSPARSELt/en/latest/reference/data-type-support.html "(in hipSPARSELt Documentation v0.2.3)") | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
