Title: System requirements (Linux) — ROCm installation (Linux)

URL Source: https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html

Markdown Content:
System requirements (Linux)[#](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#system-requirements-linux "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-06-03

5 min read time

Applies to Linux

Supported GPUs[#](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#supported-gpus "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------

The following table shows the supported AMD Instinct™ accelerators, and Radeon™ PRO and Radeon GPUs. If a GPU is not listed on this table, it’s not officially supported by AMD.

Accelerators and GPUs listed in the following table support compute workloads (no display information or graphics). If you’re using ROCm with AMD Radeon or Radeon PRO GPUs for graphics workloads, see the [Use ROCm on Radeon GPU documentation](https://rocm.docs.amd.com/projects/radeon/en/latest/docs/compatibility.html) to verify compatibility and system requirements.

AMD Instinct

| Accelerator | Architecture | LLVM target | Support |
| --- | --- | --- | --- |
| AMD Instinct MI325X | CDNA3 | gfx942 | ✅ [[1]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#ub2204) |
| AMD Instinct MI300X | CDNA3 | gfx942 | ✅ |
| AMD Instinct MI300A | CDNA3 | gfx942 | ✅ |
| AMD Instinct MI250X | CDNA2 | gfx90a | ✅ |
| AMD Instinct MI250 | CDNA2 | gfx90a | ✅ |
| AMD Instinct MI210 | CDNA2 | gfx90a | ✅ |
| AMD Instinct MI100 | CDNA | gfx908 | ✅ |
| AMD Instinct MI50 | GCN5.1 | gfx906 | ❌ |
| AMD Instinct MI25 | GCN5.0 | gfx900 | ❌ |

AMD Radeon PRO

| GPU | Architecture | LLVM target | Support |
| --- | --- | --- | --- |
| AMD Radeon AI PRO R9700 | RDNA4 | gfx1201 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon PRO V710 | RDNA3 | gfx1101 | ✅ |
| AMD Radeon PRO W7900 Dual Slot | RDNA3 | gfx1100 | ✅ |
| AMD Radeon PRO W7900 | RDNA3 | gfx1100 | ✅ |
| AMD Radeon PRO W7800 48GB | RDNA3 | gfx1100 | ✅ |
| AMD Radeon PRO W7800 | RDNA3 | gfx1100 | ✅ |
| AMD Radeon PRO W7700 | RDNA3 | gfx1101 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon PRO W6800 | RDNA2 | gfx1030 | ✅ |
| AMD Radeon PRO V620 | RDNA2 | gfx1030 | ✅ |
| AMD Radeon PRO VII | GCN5.1 | gfx906 | ❌ |

AMD Radeon

| GPU | Architecture | LLVM target | Support |
| --- | --- | --- | --- |
| AMD Radeon RX 9070 XT | RDNA4 | gfx1201 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon RX 9070 GRE | RDNA4 | gfx1201 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon RX 9070 | RDNA4 | gfx1201 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon RX 9060 XT | RDNA4 | gfx1200 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon RX 7900 XTX | RDNA3 | gfx1100 | ✅ |
| AMD Radeon RX 7900 XT | RDNA3 | gfx1100 | ✅ |
| AMD Radeon RX 7900 GRE | RDNA3 | gfx1100 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon RX 7800 XT | RDNA3 | gfx1101 | ✅ [[5]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#rdna-os) |
| AMD Radeon VII | GCN5.1 | gfx906 | ❌ |

✅: **Supported** - Official software distributions of the current ROCm release fully support this hardware.

⚠️: **Deprecated** - The current ROCm release has limited support for this hardware. Existing features and capabilities are maintained, but no new features or optimizations will be added. A future ROCm release will remove support.

❌: **Unsupported** - The current ROCm release does not support this hardware. The HIP runtime might continue to run applications for an unsupported GPU, but prebuilt ROCm libraries are not officially supported and will cause runtime errors.

Note

See the [Compatibility matrix](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html#architecture-support-compatibility-matrix "(in ROCm Documentation v6.4.1)") for an overview of supported GPU architectures across ROCm releases.

Supported operating systems[#](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#supported-operating-systems "Link to this heading")
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

AMD ROCm software supports the following Linux distributions.

| Operating system | Kernel | Glibc | Support |
| --- | --- | --- | --- |
| Ubuntu 24.04.2 | 6.8 [GA], 6.11 [HWE] | 2.39 | ✅ |
| Ubuntu 22.04.5 | 5.15 [GA], 6.8 [HWE] | 2.35 | ✅ |
| RHEL 9.6 | 5.14+ | 2.34 | ✅ |
| RHEL 9.5 | 5.14+ | 2.34 | ✅ |
| RHEL 9.4 | 5.14+ | 2.34 | ✅ |
| RHEL 8.10 | 4.18.0+ | 2.28 | ✅ |
| SLES 15 SP6 | 6.5.0+ | 2.38 | ✅ |
| Oracle Linux 9 | 5.15.0 (UEK) | 2.35 | ✅ [[2]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#mi300x) |
| Oracle Linux 8 | 5.15.0 (UEK) | 2.28 | ✅ [[2]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#mi300x) |
| Azure Linux 3.0 | 6.6.60 | 2.38 | ✅ [[3]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#azurelinux) |
| Debian 12 | 6.1 | 2.36 | ✅ [[4]](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#single-node) |

Note

*   See [Red Hat Enterprise Linux Release Dates](https://access.redhat.com/articles/3078) to learn about the specific kernel versions supported on Red Hat Enterprise Linux (RHEL).

*   See [List of SUSE Linux Enterprise Server kernel](https://www.suse.com/support/kb/doc/?id=000019587) to learn about the specific kernel version supported on SUSE Linux Enterprise Server (SLES).

*   See the [Compatibility matrix](https://rocm.docs.amd.com/en/latest/compatibility/compatibility-matrix.html "(in ROCm Documentation v6.4.1)") for an overview of OS support across ROCm releases.

Virtualization support[#](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#virtualization-support "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ROCm supports virtualization for the Instinct accelerators and Radeon PRO GPUs listed in the following table.

| GPU | Hypervisor | Virtualization technology | Host OS and version | Guest OS |
| --- | --- | --- | --- | --- |
| MI325X | KVM | SRIOV | Ubuntu 22.04 | Ubuntu 22.04 |
| MI300X | Hyper-V | SRIOV | Azure Host 2021 | Ubuntu 22.04 |
| KVM | SRIOV | Ubuntu 22.04 | Ubuntu 22.04 |
| KVM | Passthrough | Ubuntu 22.04 | Ubuntu 22.04 |
| MI250 | Hyper-V | DDA | Azure Host 2021 | Ubuntu 22.04 |
| MI210 | KVM | SRIOV | RHEL 9.4 | Ubuntu 22.04, RHEL 9.4 |
| V710 | KVM | SRIOV | Ubuntu 24.04 | Ubuntu 24.04 |
| Hyper-V | SRIOV | Azure Host 2024 | Ubuntu 24.04 |
| V620 | Hyper-V | SRIOV | Azure Host 2024 | Ubuntu 24.04 |

Note

These virtualization technologies are designed to dedicate entire GPUs to individual virtual machines (VMs), rather than allowing a single GPU to be shared across multiple VMs.

CPU support[#](https://rocm.docs.amd.com/projects/install-on-linux/en/latest/reference/system-requirements.html#cpu-support "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------

ROCm requires CPUs that support PCIe™ atomics. Modern CPUs after the release of 1st generation AMD Zen CPU and Intel™ Haswell support PCIe atomics.

Footnotes
