#!/usr/bin/env python3
"""Debug what the API is receiving and generating"""

import requests
import json

# Simulate the frontend request
url = "http://localhost:8000/api/public/hunter/search"

# This is what the frontend sends
payload = {
    "search_id": "test_debug_123",
    "user_id": "temp-user-123",
    "search_config": {
        "searchName": "Belfast Roofing Contractors Q1 2025",
        "searchObjective": "Find established roofing contractors and construction companies in Belfast area for potential partnership opportunities.",
        "selectedSources": ["web"],
        "industry": "Roofing and Construction",
        "location": "Belfast, Northern Ireland, UK",
        "companySize": "11-50",
        "jobTitles": ["CEO", "Business Owner"],
        "keywords": "roofing contractor, roof repair, commercial roofing",
        "includeEmails": True,
        "includePhones": True,
        "includeLinkedIn": False,
        "validationCriteria": {
            "mustHaveWebsite": True,
            "mustHaveContactInfo": True,
            "mustHaveSpecificKeywords": ["roofing", "roof", "contractor"],
            "mustBeInIndustry": True,
            "customValidationRules": "Must offer roofing services"
        }
    }
}

print("Sending request to API...")
print(f"Payload: {json.dumps(payload, indent=2)}")

try:
    response = requests.post(url, json=payload)
    print(f"\nResponse status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")