Title: ROCm Linux Filesystem Hierarchy Standard reorganization — ROCm Documentation

URL Source: https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html

Markdown Content:
Contents
--------

*   [Introduction](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#introduction)
*   [Adopting the FHS](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#adopting-the-fhs)
*   [Changes from earlier ROCm versions](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#changes-from-earlier-rocm-versions)
*   [ROCm FHS reorganization: backward compatibility](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#rocm-fhs-reorganization-backward-compatibility)
    *   [Wrapper header files](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#wrapper-header-files)
    *   [Executable files](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#executable-files)
    *   [Library files](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#library-files)
    *   [CMake config files](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#cmake-config-files)

*   [Changes required in applications using ROCm](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#changes-required-in-applications-using-rocm)
*   [Changes in versioning specifications](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#changes-in-versioning-specifications)

ROCm Linux Filesystem Hierarchy Standard reorganization[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#rocm-linux-filesystem-hierarchy-standard-reorganization "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-04-17

7 min read time

Applies to Linux and Windows

Introduction[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#introduction "Link to this heading")
-------------------------------------------------------------------------------------------------------------------

The ROCm Software has adopted the Linux Filesystem Hierarchy Standard (FHS) [https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html) in order to to ensure ROCm is consistent with standard open source conventions. The following sections specify how current and future releases of ROCm adhere to FHS, how the previous ROCm file system is supported, and how improved versioning specifications are applied to ROCm.

Adopting the FHS[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#adopting-the-fhs "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------

In order to standardize ROCm directory structure and directory content layout ROCm has adopted the [FHS](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html), adhering to open source conventions for Linux-based distribution. FHS ensures internal consistency within the ROCm stack, as well as external consistency with other systems and distributions. The ROCm proposed file structure is outlined below:

/opt/rocm-<ver>
    | -- bin
         | -- all public binaries
    | -- lib
         | -- lib<soname>.so->lib<soname>.so.major->lib<soname>.so.major.minor.patch
              (public libaries to link with applications)
         | -- <component>
              | -- architecture dependent libraries and binaries used internally by components
         | -- cmake
              | -- <component>
                   | --<component>-config.cmake
    | -- libexec
         | -- <component>
              | -- non ISA/architecture independent executables used internally by components
    | -- include
         | -- <component>
              | -- public header files
    | -- share
         | -- html
              | -- <component>
                   | -- html documentation
         | -- info
              | -- <component>
                   | -- info files
         | -- man
              | -- <component>
                   | -- man pages
         | -- doc
              | -- <component>
                   | -- license files
         | -- <component>
              | -- samples
              | -- architecture independent misc files

Changes from earlier ROCm versions[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#changes-from-earlier-rocm-versions "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------

The following table provides a brief overview of the new ROCm FHS layout, compared to the layout of earlier ROCm versions. Note that /opt/ is used to denote the default rocm-installation-path and should be replaced in case of a non-standard installation location of the ROCm distribution.

 ______________________________________________________
|  New ROCm Layout            |  Previous ROCm Layout  |
|_____________________________|________________________|
| /opt/rocm-<ver>             | /opt/rocm-<ver>        |
|     | -- bin                |     | -- bin           |
|     | -- lib                |     | -- lib           |
|          | -- cmake         |     | -- include       |
|     | -- libexec            |     | -- <component_1> |
|     | -- include            |          | -- bin      |
|          | -- <component_1> |          | -- cmake    |
|     | -- share              |          | -- doc      |
|          | -- html          |          | -- lib      |
|          | -- info          |          | -- include  |
|          | -- man           |          | -- samples  |
|          | -- doc           |     | -- <component_n> |
|          | -- <component_1> |          | -- bin      |
|               | -- samples  |          | -- cmake    |
|               | -- ..       |          | -- doc      |
|          | -- <component_n> |          | -- lib      |
|               | -- samples  |          | -- include  |
|               | -- ..       |          | -- samples  |
|______________________________________________________|

ROCm FHS reorganization: backward compatibility[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#rocm-fhs-reorganization-backward-compatibility "Link to this heading")
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

The FHS file organization for ROCm was first introduced in the release of ROCm 5.2 . Backward compatibility was implemented to make sure users could still run their ROCm applications while transitioning to the new FHS. ROCm has moved header files and libraries to their new locations as indicated in the above structure, and included symbolic-links and wrapper header files in their old location for backward compatibility. The following sections detail ROCm backward compatibility implementation for wrapper header files, executable files, library files and CMake config files.

### Executable files[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#executable-files "Link to this heading")

Executable files are available in the `/opt/rocm-<ver>/bin` folder. For backward compatibility, the old library location (`/opt/rocm-<ver>/<component>/bin`) has a soft link to the library at the new location. Soft links will be removed in a future release, tentatively ROCm v6.0.

$ ls -l /opt/rocm/hip/bin/
lrwxrwxrwx 1 root root 24 Jan 1 23:32 hipcc -> ../../bin/hipcc

### Library files[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#library-files "Link to this heading")

Library files are available in the `/opt/rocm-<ver>/lib` folder. For backward compatibility, the old library location (`/opt/rocm-<ver>/<component>/lib`) has a soft link to the library at the new location. Soft links will be removed in a future release, tentatively ROCm v6.0.

$ ls -l /opt/rocm/hip/lib/
drwxr-xr-x 4 root root 4096 Jan 1 10:45 cmake
lrwxrwxrwx 1 root root 24 Jan 1 23:32 libamdhip64.so -> ../../lib/libamdhip64.so

### CMake config files[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#cmake-config-files "Link to this heading")

All CMake configuration files are available in the `/opt/rocm-<ver>/lib/cmake/<component>` folder. For backward compatibility, the old CMake locations (`/opt/rocm-<ver>/<component>/lib/cmake`) consist of a soft link to the new CMake config. Soft links will be removed in a future release, tentatively ROCm v6.0.

$ ls -l /opt/rocm/hip/lib/cmake/hip/
lrwxrwxrwx 1 root root 42 Jan 1 23:32 hip-config.cmake -> ../../../../lib/cmake/hip/hip-config.cmake

Changes required in applications using ROCm[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#changes-required-in-applications-using-rocm "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Applications using ROCm are advised to use the new file paths. As the old files will be deprecated in a future release. Applications have to make sure to include correct header file and use correct search paths.

1.   `#include<header_file.h>` needs to be changed to `#include <component/header_file.h>`

For example: `#include <hip.h>` needs to change to `#include <hip/hip.h>`

2.   Any variable in CMake or Makefiles pointing to component folder needs to changed.

For example: `VAR1=/opt/rocm/hip` needs to be changed to `VAR1=/opt/rocm``VAR2=/opt/rocm/hsa` needs to be changed to `VAR2=/opt/rocm`

3.   Any reference to `/opt/rocm/<component>/bin` or `/opt/rocm/<component>/lib` needs to be changed to `/opt/rocm/bin` and `/opt/rocm/lib/`, respectively.

Changes in versioning specifications[#](https://rocm.docs.amd.com/en/latest/conceptual/file-reorg.html#changes-in-versioning-specifications "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------------------

In order to better manage ROCm dependencies specification and allow smoother releases of ROCm while avoiding dependency conflicts, ROCm software shall adhere to the following scheme when numbering and incrementing ROCm files versions:

rocm-<ver>, where <ver> = <x.y.z>

x.y.z denote: MAJOR.MINOR.PATCH

z: PATCH - increment z when implementing backward compatible bug fixes.

y: MINOR - increment y when implementing minor changes that add functionality but are still backward compatible.

x: MAJOR - increment x when implementing major changes that are not backward compatible.
