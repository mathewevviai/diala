import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from convex import ConvexClient
from dotenv import load_dotenv

# Load environment variables
backend_env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(backend_env_path)

# Also try to load from frontend for Convex URL if backend doesn't have it
frontend_env_path = os.path.join(os.path.dirname(__file__), "../frontend/.env.local")
load_dotenv(frontend_env_path, override=False)

CONVEX_URL = os.getenv("CONVEX_URL") or os.getenv("NEXT_PUBLIC_CONVEX_URL", "http://127.0.0.1:3210")
print(f"Testing Convex webhook with URL: {CONVEX_URL}")

# Initialize Convex client
convex_client = ConvexClient(CONVEX_URL)

# Test the webhook
try:
    # First, let's try to call the mutation with a test job ID
    result = convex_client.mutation("mutations/tiktokContent/jobWebhook", {
        "jobId": "38c8254b-ac0b-4448-85ce-92b3341bbcdf",  # The job ID from the logs
        "status": "failed",
        "error": "Testing webhook from Python script"
    })
    print(f"Webhook call successful! Result: {result}")
except Exception as e:
    print(f"Webhook call failed: {e}")
    print(f"Error type: {type(e).__name__}")
    
# Try to query the job to see if it exists
try:
    # Note: Convex Python client doesn't support queries directly, 
    # but we can verify by trying another mutation
    print("\nTrying to find job in database...")
except Exception as e:
    print(f"Query failed: {e}")