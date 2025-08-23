Title: ROCm LLVM compiler infrastructure — llvm-project 19.0.0 Documentation

URL Source: https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html

Markdown Content:
ROCm LLVM compiler infrastructure — llvm-project 19.0.0 Documentation

===============

[Skip to main content](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html#main-content)

Back to top- [x] - [x] 

Ctrl+K

[![Image 1: AMD Logo](https://rocm.docs.amd.com/projects/llvm-project/en/latest/_static/images/amd-header-logo.svg)](https://www.amd.com/)[ROCm™ Software 6.4.1](https://rocm.docs.amd.com/en/latest)[Version List](https://rocm.docs.amd.com/en/latest/release/versions.html)

*   [GitHub](https://github.com/ROCm/llvm-project)
*   [Community](https://github.com/ROCm/ROCm/discussions)
*   [Blogs](https://rocm.blogs.amd.com/)
*   [ROCm Developer Hub](https://www.amd.com/en/developer/resources/rocm-hub.html)
*   [Instinct™ Docs](https://instinct.docs.amd.com/)
*   [Infinity Hub](https://www.amd.com/en/developer/resources/infinity-hub.html)
*   [Support](https://github.com/ROCm/llvm-project/issues/new/choose)

[ROCm documentation](https://rocm.docs.amd.com/en/latest)

[llvm-project 19.0.0 Documentation](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html#)

Search Ctrl+K

Conceptual

*   [Using AddressSanitizer](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/using-gpu-sanitizer.html)
*   [ROCm OpenMP support](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/openmp.html)
*   [Code portability and compression](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/code-portability.html)
*   [ROCm support for SPIR-V](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/spirv.html)

Reference

*   [ROCm compiler reference](https://rocm.docs.amd.com/projects/llvm-project/en/latest/reference/rocmcc.html)
*   [Clang documentation](http://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/clang/html/index.html)
*   [Clang-tools documentation](http://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/clang-tools/html/index.html)
*   [HIPCC documentation](https://rocm.docs.amd.com/projects/HIPCC/en/latest/index.html)
*   [HIPIFY documentation](https://rocm.docs.amd.com/projects/HIPIFY/en/latest/index.html)
*   [LLD documentation](http://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/lld/html/index.html)
*   [LLVM documentation](http://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/llvm/html/index.html)

About

*   [License](https://github.com/ROCm/llvm-project/blob/amd-staging/LICENSE.TXT)

ROCm LLVM compiler infrastructure
=================================

ROCm LLVM compiler infrastructure[#](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html#rocm-llvm-compiler-infrastructure "Link to this heading")
===================================================================================================================================================================

The AMD `llvm-project` is a fork of [llvm/llvm-project](https://github.com/llvm/llvm-project). The AMD code is open and hosted at [ROCm/llvm-project](https://github.com/ROCm/llvm-project).

 Conceptual

*   [Using AddressSanitizer](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/using-gpu-sanitizer.html)

*   [OpenMP support](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/openmp.html)

*   [Code portability and compression](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/code-portability.html#generic-code)

*   [ROCm support for SPIR-V (beta)](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/spirv.html#spirv)

 Reference

*   [AMD ROCm compiler reference](https://rocm.docs.amd.com/projects/llvm-project/en/latest/reference/rocmcc.html)

*   [Clang documentation](https://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/clang/html/index.html)

*   [Clang-tools documentation](https://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/clang-tools/html/index.html)

*   [HIPCC documentation](https://rocm.docs.amd.com/projects/HIPCC/en/latest/index.html "(in HIPCC Documentation v1.1.1)")

*   [HIPIFY documentation](https://rocm.docs.amd.com/projects/HIPIFY/en/latest/index.html "(in HIPIFY Documentation)")

*   [LLD documentation](https://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/lld/html/index.html)

*   [LLVM documentation](https://rocm.docs.amd.com/projects/llvm-project/en/latest/LLVM/llvm/html/index.html)

ROCm includes multiple compilers of varying origins and purposes as described in the following table:

**Name****Description**
`amdclang++`Clang/LLVM-based compiler that is part of `rocm-llvm` package. The source code is available at [ROCm/llvm-project](https://github.com/ROCm/llvm-project).
`AOCC`Closed-source clang-based compiler that includes additional CPU optimizations. **NOTE:**`AOCC` is not delivered as part of ROCm. For more information, see [https://developer.amd.com/amd-aocc](https://developer.amd.com/amd-aocc).
`HIP-Clang`Another name for the `amdclang++` compiler.
`HIPIFY`Tools used to automatically translate CUDA source code into portable HIP C++, including `hipify-clang` and `hipify-perl`. The source code is available at [ROCm/HIPIFY](https://github.com/ROCm/HIPIFY).
`hipcc`HIP compiler driver utility that invokes `clang` or `nvcc` and passes the appropriate include and library options for the target compiler and HIP infrastructure. See the [ROCm/llvm-project](https://github.com/ROCm/llvm-project/tree/amd-staging/amd/hipcc) for more information.

AMD ROCm also provides additional open-source utilities and libraries for building GPU code located in the `llvm-project/amd` directory:

**Name****Description**
`amd/comgr`The Code Object Manager API, designed to simplify linking, compiling, and inspecting code objects. See the [llvm-project/amd/comgr/README](https://github.com/ROCm/llvm-project/tree/amd-staging/amd/comgr) for more information.
`amd/device-libs`The sources and CMake build system for a set of AMD-specific device-side language runtime libraries. See the [llvm-project/amd/device-libs/README](https://github.com/ROCm/llvm-project/tree/amd-staging/amd/device-libs) for more information.

[next Using the AddressSanitizer on a GPU](https://rocm.docs.amd.com/projects/llvm-project/en/latest/conceptual/using-gpu-sanitizer.html "next page")

*   [Terms and Conditions](https://www.amd.com/en/corporate/copyright)
*   [ROCm Licenses and Disclaimers](https://rocm.docs.amd.com/en/latest/about/license.html)
*   [Privacy](https://www.amd.com/en/corporate/privacy)
*   [Trademarks](https://www.amd.com/en/corporate/trademarks)
*   [Supply Chain Transparency](https://www.amd.com/content/dam/amd/en/documents/corporate/cr/supply-chain-transparency.pdf)
*   [Fair and Open Competition](https://www.amd.com/en/corporate/competition)
*   [UK Tax Strategy](https://www.amd.com/system/files/documents/amd-uk-tax-strategy.pdf)
*   [Cookie Policy](https://www.amd.com/en/corporate/cookies)
*   [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html#cookie-settings)

© 2025 Advanced Micro Devices, Inc

Cookie Notice
-------------

This website uses cookies and other tracking technologies to enhance user experience and to analyze performance and traffic on our website. We also share information about your use of our site with our social media, advertising and analytics partners. If a [Do Not Sell or Share My Personal Information](https://rocm.docs.amd.com/projects/llvm-project/en/latest/index.html#cookiesettings) preference is detected it will be honored. Further information is available in our [Cookies Policy](https://www.amd.com/en/legal/cookies.html) and [Privacy Notice](https://www.amd.com/en/legal/privacy.html).

Cookie Settings Accept Cookies

![Image 2: Company Logo](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1f-b60d-748d-a5fd-db95d4430544/logos/522af4e3-8eb6-419a-ab34-33424f162acd/1563d021-9ae8-485d-a534-cc8715c52cbd/a0326644-47a6-416e-b4b4-b49d4fd8257a/AMD-Logo-700x394.png)

Do Not Sell or Share My Personal Data
-------------------------------------

California residents have certain rights with regard to the sale of personal information to third parties. Advanced Micro Devices and our partners use information collected through cookies or in other forms to improve experience on our site and pages, analyze how it is used and provide a more personalized experience. 

 You can choose not to allow certain types of cookies, which may impact your experience of the site and the services we are able to offer. At any point, you can click on the different category headings to find out more and change our default settings according to your preference. 

 You can opt out of the sale of your personal information by clicking ‘Share or Sale Personal Data” and change the default settings. 

 You cannot opt-out of our Strictly Necessary Cookies as they are deployed in order to ensure the proper functioning of our website (such as prompting the cookie banner and remembering your settings, to log into your account, to redirect you when you log out, etc.). For more information about the First and Third Party Cookies used please follow this link. 

[More information](https://www.amd.com/en/legal/cookies.html)

Allow All
### Manage Consent Preferences

#### Strictly Necessary Cookies

Always Active

These are cookies that are technically required for the operation of the Sites. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging into secure areas of the Sites or filling in forms. These cookies store data such as online identifiers (including IP address and device identifiers) along with the information used to operate the Sites. We may estimate your geographic location based on your IP address to help us display the content available in your location and adjust the operation of the Sites.

Cookies Details‎

#### Share Or Sale of Personal Data

- [x] Share Or Sale of Personal Data 

Under the CPRA, you have the right to opt-out of the sale or sharing of your personal information to third parties. These cookies collect information for analytics and to personalize your experience with targeted ads. You may exercise your right to opt out of the sale or sharing of personal information by using this toggle switch. If you opt out we will not be able to offer you personalized ads and will not hand over your personal information to any third parties. Additionally, you may contact our legal department for further clarification about your rights as a California consumer by using this Exercise My Rights link.If you have enabled privacy controls on your browser (such as a plugin), we have to take that as a valid request to opt-out. Therefore we would not be able to track your activity through the web. This may affect our ability to personalize ads according to your preferences.

*   ##### Performance Cookies

- [x] Switch Label label  
These cookies allow us to recognize and count the number of visitors and to see how visitors move around the Sites when they use them. This helps us to understand what areas of the Sites are of interest to you and to improve the way the Sites work, for example, by helping you find what you are looking for easily. We may use third party web analytics providers to help us analyze the use of the Sites, email, and newsletters. These cookies store data such as online identifiers (including IP address and device identifiers), information about your web browser and operating system, website usage activity information (including the frequency of your visits, your actions on the Sites and, if you arrived at any of the Sites from another website, i.e. the URL of that website), and content-related activity (including the email and newsletter content you view and click on).

*   ##### Targeting Cookies

- [x] Switch Label label  
These cookies record online identifiers (including IP address and device identifiers), information about your web browser and operating system, website usage activity information (such as information about your visit to the Sites, the pages you have visited, content you have viewed, and the links you have followed), and content-related activity (including the email and newsletter content you view and click on). The information is used to try to make the Sites, emails, and newsletters, and the advertising displayed on them and other websites more relevant to your interests. For instance, when you visit the Sites, these targeting cookies are used by third party providers for remarketing purposes to allow them to show you advertisements for our products when you visit other websites on the internet. Our third party providers may collect and combine information collected through the Sites, emails, and newsletters with other information about your visits to other websites and apps over time, if those websites and apps also use the same providers.

*   ##### Functionality Cookies

- [x] Switch Label label  
These cookies are used to recognize you when you return to the Sites. This enables us to remember your preferences (for example, your choice of language or region) or when you register on areas of the Sites, such as our web programs or extranets. These cookies store data such as online identifiers (including IP address and device identifiers) along with the information used to provide the function.

Cookies Details‎

### Cookie List

Clear

- [x] checkbox label label

Apply Cancel

Consent Leg.Interest

- [x] checkbox label label

- [x] checkbox label label

- [x] checkbox label label

Reject All Confirm My Choices

[![Image 3: Powered by Onetrust](https://download.amd.com/OneTrust/202503.2.0/consent/17a54836-920d-4fc2-a8f6-3f4c299371d1/01936e1f-b60d-748d-a5fd-db95d4430544/logos/static/powered_by_logo.svg)](https://www.onetrust.com/products/cookie-consent/)
