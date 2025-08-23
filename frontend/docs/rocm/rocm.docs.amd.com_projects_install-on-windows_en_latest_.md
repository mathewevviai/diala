Title: HIP SDK installation for Windows — HIP SDK installation (Windows)

URL Source: https://rocm.docs.amd.com/projects/install-on-windows/en/latest/

Markdown Content:
Contents
--------

*   [HIP SDK changes](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#hip-sdk-changes)
*   [Windows quick start installation guide](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#windows-quick-start-installation-guide)
    *   [System requirements](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#system-requirements)
    *   [HIP SDK installation](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#hip-sdk-installation)
    *   [Uninstall](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#uninstall)

HIP SDK installation for Windows[#](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#hip-sdk-installation-for-windows "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------------

2025-02-13

5 min read time

Applies to Windows

The HIP SDK for Windows brings a subset of the [ROCm](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/reference/component-support.html) platform to Windows. It provides APIs and tooling to leverage the computational power of accelerators and GPUs to create high-performance, portable applications using [HIP](https://rocm.docs.amd.com/projects/HIP/en/latest/index.html "(in HIP Documentation v6.4.43483)").

HIP SDK changes[#](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#hip-sdk-changes "Link to this heading")
---------------------------------------------------------------------------------------------------------------------------

As of ROCm version 6.1.2, the HIP SDK for Windows includes updated versions of the runtime components `amdhip64` and `amd_comgr`. To use the latest capabilities of the HIP SDK, reference the new versions of these DLL binaries:

*   `amdhip64_6.dll` (formerly `amdhip64.dll`)

*   `amd_comgr_2.dll` (formerly `amd_comgr.dll`)

The latest version of HIP Ray Tracing (RT) is also installed.

Note

The HIP SDK on Windows for ROCm 6.x is not backwards compatible with previous major versions such as 5.x.

Windows quick start installation guide[#](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#windows-quick-start-installation-guide "Link to this heading")
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

For a quick summary on installing the HIP SDK on Windows, follow the steps listed on this page. Find a more detailed installation guide in [Install HIP SDK](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/how-to/install.html#hip-install-full).

### System requirements[#](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#system-requirements "Link to this heading")

The HIP SDK is supported on Windows 10 and 11, and Windows Server 2022. You can install HIP on a system without AMD GPUs to use the build toolchains, but to run HIP applications, you’ll need a compatible GPU. Refer to [Windows-supported GPUs and APUs](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/reference/system-requirements.html#supported-gpus-win) for more details.

### HIP SDK installation[#](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#hip-sdk-installation "Link to this heading")

1.   Download the installer.

Download the installer from the [HIP SDK download page](https://www.amd.com/en/developer/resources/rocm-hub/hip-sdk.html).

The download page lists supported OSes for different available ROCm versions, with a link to download the related installer. Select the download file matching the ROCm version you want to install.

Clicking the HIP SDK download link takes you to a license page that you must accept before the download will begin. Specify the location to save the download file to.

2.   Launch the installer.

To launch the AMD HIP SDK Installer, click the **Setup** icon shown in the following image.

[![Image 1: Icon with AMD arrow logo and User Access Control Shield overlay](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/000-setup-icon.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/000-setup-icon.png)
The installer requires Administrator Privileges, so you may be greeted with a User Access Control (UAC) pop-up. Click Yes.

[![Image 2: User Access Control pop-up](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/001-uac-dark.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/001-uac-dark.png)[![Image 3: User Access Control pop-up](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/001-uac-light.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/001-uac-light.png)
The installer executable will temporarily extract installer packages to `C:\\AMD`, which it removes after completing the installation. You’ll see the “Initializing install” window during extraction.

[![Image 4: Window with AMD arrow logo, futuristic background and progress counter](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/002-initializing.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/002-initializing.png)
The installer will then detect your system configuration to determine which installable components are applicable to your system.

[![Image 5: Window with AMD arrow logo, futuristic background and activity indicator](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/003-detecting-system-config.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/003-detecting-system-config.png)
3.   Customize the install.

When the installer launches, it displays a window that lets you customize the installation. By default, all components are selected for installation.

[![Image 6: Window with AMD arrow logo, futuristic background and activity indicator](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/004-installer-window-620.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/004-installer-window-620.png)
    1.   HIP SDK installer

The HIP SDK installation options are listed in the following table.

| HIP components | Install type | Additional options |
| --- | --- | --- |
| HIP SDK Core | 6.2.0 | Install location |
| HIP Libraries | Full, Partial, None | Runtime, Development (Libs and headers) |
| HIP Runtime Compiler | Full, Partial, None | Runtime, Development (headers) |
| HIP Ray Tracing | Full, Partial, None | Runtime, Development (headers) |
| [Visual Studio Plugin](https://rocm.docs.amd.com/projects/hip-vs/en/latest/) | Full, Partial, None | Visual Studio 2017, 2019, 2022 Plugin | Note

The `select`/`deselect all` options only apply to the installation of HIP SDK components. To install the bundled AMD Display Driver, manually select the install type. Tip

Should you only wish to install a few select components, deselecting all, then selecting individual components may be more convenient. 
    2.   AMD display driver

The HIP SDK installer bundles an AMD Radeon Software PRO 23.30 installer. The supported install options and types are summarized in the following tables:

| Install option | Description |
| --- | --- |
| Install Location | Location on disk to store driver files. |
| Install Type | The breadth of components to be installed. |
| Factory Reset (optional) | A Factory Reset will remove all prior versions of AMD HIP SDK and drivers. You will not be able to roll back to previously installed drivers. | | Install type | Description |
| --- | --- |
| Full Install | Provides all AMD Software features and controls for gaming, recording, streaming, and tweaking the performance on your graphics hardware. |
| Minimal Install | Provides only the basic controls for AMD Software features and does not include advanced features such as performance tweaking or recording and capturing content. |
| Driver Only | Provides no user interface for AMD Software features. | Note

You must perform a system restart for a complete installation of the Display driver. 

4.   Install components.

Please wait for the installation to complete as shown in the following image.

[![Image 7: Window with AMD arrow logo, futuristic background and progress meter](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/012-install-progress.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/012-install-progress.png)
5.   Complete installation.

After the installation is complete, the installer window might prompt you for a system restart. Click **Finish** or **Restart** in the lower-right corner, as shown in the following image.

[![Image 8: Window with AMD arrow logo, futuristic background and completion notice](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/013-install-complete.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/013-install-complete.png)Note

If the installer terminates mid-installation, you can safely remove the temporary directory created under C:\AMD. Installed components don’t depend on this folder unless you explicitly chose this as the install folder. 

### Uninstall[#](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/#uninstall "Link to this heading")

All components, except the Visual Studio plug-in, should be uninstalled through Control Panel > Add/Remove Program. You can uninstall HIP SDK components through the Windows Settings app. Navigate to “Apps > Installed apps”, click the ellipsis (…) on the far right next to the component you want to uninstall, then click “Uninstall”.

[![Image 9: Installed apps section of the settings app showing installed HIP SDK components](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/014-uninstall-dark.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/014-uninstall-dark.png)[![Image 10: Installed apps section of the settings app showing installed HIP SDK components](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/014-uninstall-light.png)](https://rocm.docs.amd.com/projects/install-on-windows/en/latest/_images/014-uninstall-light.png)
