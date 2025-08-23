FCA Broker/Affiliate Program Finder
A multi-phase Python script that extracts, processes, and validates FCA-approved finance companies with broker/affiliate programs using search APIs and Jina AI Reader.

Overview
This script automates the process of finding and validating finance companies that:

Are approved by the Financial Conduct Authority (FCA)
Operate as brokers or offer affiliate/partner programs
May have IAR (Introducer Appointed Representative) relationships
The script operates in 6 distinct phases:

Search - Find potential companies using search APIs
Extract Links - Parse and normalize links from search results
Extract Content - Use Jina AI Reader to extract content from websites
Save Content - Organize and save all website content and metadata
Validate - Apply criteria to validate each entry
Create Final - Generate a final JSON file with validated entries
Requirements
Python 3.6+
Jina AI Reader API key (must be added to .env file)
Installation
Clone this repository
Create a .env file based on .env.example and add your Jina AI Reader API key
Install required packages:

## Module Documentation

- **main.py**  
  _Entry point script; orchestrates the execution of each phase to perform searching, extracting, processing, validating, and final report creation._

- **phases/phase1_search.py**  
  **Phase 1: Search for FCA-approved finance companies using a search API.**  
  This module uses a search API to find FCA-approved finance companies with broker/affiliate programs and saves the results to a JSON file.

- **phases/phase2_extract_links.py**  
  **Phase 2: Extract links from search results.**  
  This module extracts all links from the search results obtained in Phase 1 and saves them to a JSON file.

- **phases/phase3_extract_content.py**  
  **Phase 3: Extract content from websites using Jina AI Reader.**  
  This module uses the Jina AI Reader API to extract content from each website in the list of extracted links from Phase 2.

- **phases/phase4_save_content.py**  
  **Phase 4: Save all website content and links to a JSON file.**  
  This module processes and organizes the data from previous phases and ensures continuous progress tracking.

- **phases/phase5_validate.py**  
  **Phase 5: Process the initial JSON file to validate each entry.**  
  This module applies validation criteria to the combined data from Phase 4 to identify FCA-approved finance companies with broker/affiliate programs, using both rule-based validation and AI-powered validation via DeepSeek.

- **phases/phase6_create_final_report.py**  
  **Phase 6: Create a final JSON file containing only validated entries.**  
  This module filters the validated data from Phase 5 to create a final JSON file with only the entries that meet all criteria.

- **utils/api_clients.py**  
  _API client utilities for the FCA Broker/Affiliate Program Finder._  
  This module provides clients for interacting with various APIs used in the script, including search APIs, the Jina AI Reader API, and DeepSeek AI for content analysis.

- **utils/data_processing.py**  
  _Data processing utilities for the FCA Broker/Affiliate Program Finder._  
  This module provides functions for processing and manipulating data throughout the different phases of the script.

- **utils/validation.py**  
  _Validation utilities for the FCA Broker/Affiliate Program Finder._  
  This module provides functions for validating website content against specific criteria to identify FCA-approved finance companies with broker/affiliate programs.
