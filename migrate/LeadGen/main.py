#!/usr/bin/env python3
"""
FCA Broker/Affiliate Program Finder

This script finds, extracts, and validates FCA-approved finance companies
with broker/affiliate programs using search APIs and Jina AI Reader.

The script operates in 6 phases:
1. Search for companies using search API
2. Extract links from search results
3. Extract content from websites using Jina AI Reader
4. Save website content and links
5. Validate entries based on specific criteria
6. Create final JSON file with validated entries

The script can also be run as a Flask web application to view and explore the results.
"""

import os
import argparse
import logging
import json
import traceback
from pathlib import Path
from dotenv import load_dotenv
import flask
from flask import Flask, render_template, jsonify, request, redirect, url_for

from phases import phase1_search, phase2_extract_links, phase3_extract_content, \
                  phase4_save_content, phase5_validate, phase6_create_final

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("fca_finder.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Flask routes
@app.route('/')
def index():
    """Main page with overview of the FCA finder application."""
    import time
    
    status = {
        "phases_complete": [],
        "total_companies": 0,
        "valid_companies": 0,
        "logs": {},  # Add logs dictionary
        "running_phase": None  # Track which phase is running
    }
    
    # Check which phases have been completed
    if os.path.exists("data/search_results.json"):
        status["phases_complete"].append(1)
    if os.path.exists("data/extracted_links.json"):
        status["phases_complete"].append(2)
    if os.path.exists("data/website_contents.json"):
        status["phases_complete"].append(3)
    if os.path.exists("data/combined_data.json"):
        status["phases_complete"].append(4)
    if os.path.exists("data/validated_data.json"):
        status["phases_complete"].append(5)
    if os.path.exists("data/final_results.json"):
        status["phases_complete"].append(6)
        
        # Load final results to show statistics
        try:
            with open("data/final_results.json", 'r') as f:
                data = json.load(f)
                status["valid_companies"] = len(data.get("results", []))
        except Exception as e:
            logger.error(f"Error loading final results: {e}")
    
    # Get total number of companies found (if available)
    if os.path.exists("data/search_results.json"):
        try:
            with open("data/search_results.json", 'r') as f:
                data = json.load(f)
                status["total_companies"] = len(data.get("results", []))
        except Exception as e:
            logger.error(f"Error loading search results: {e}")
    elif os.path.exists("data/validated_data.json"):
        try:
            with open("data/validated_data.json", 'r') as f:
                data = json.load(f)
                status["total_companies"] = len(data.get("websites", []))
        except Exception as e:
            logger.error(f"Error loading validated data: {e}")
    
    # Load log files for each completed phase
    for phase in range(1, 7):
        log_file = f"data/phase{phase}_last_run.log"
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r') as f:
                    # Get last 50 lines for preview
                    lines = f.readlines()
                    last_lines = lines[-50:] if len(lines) > 50 else lines
                    status["logs"][phase] = "".join(last_lines)
                
                # Check if this phase is currently running (modified in the last 10 seconds)
                if time.time() - os.path.getmtime(log_file) < 10:
                    status["running_phase"] = phase
            except Exception as e:
                logger.error(f"Error loading logs for phase {phase}: {e}")
                status["logs"][phase] = f"Error loading logs: {str(e)}"
    
    return render_template('index.html', status=status)

@app.route('/get_logs/<int:phase>')
def get_logs(phase):
    """AJAX endpoint to get the latest logs for a specific phase."""
    import time
    
    if phase < 1 or phase > 6:
        return jsonify({"error": "Invalid phase"})
    
    log_file = f"data/phase{phase}_last_run.log"
    
    if os.path.exists(log_file):
        try:
            # Get file modification time to help client determine if logs have changed
            mod_time = os.path.getmtime(log_file)
            
            with open(log_file, 'r') as f:
                log_content = f.read()
            
            # Get total companies count if phase is 1 (search)
            total_companies = 0
            if phase == 1 and os.path.exists("data/search_results.json"):
                try:
                    with open("data/search_results.json", 'r') as f:
                        data = json.load(f)
                        total_companies = len(data.get("results", []))
                except:
                    pass
            
            return jsonify({
                "logs": log_content, 
                "modified": mod_time,
                "running": time.time() - mod_time < 10,  # If modified in last 10 seconds
                "total_companies": total_companies
            })
            
        except Exception as e:
            logger.error(f"Error reading log file: {e}")
            return jsonify({"error": f"Error reading log file: {e}"})
    
    return jsonify({"logs": "No logs available for this phase", "modified": 0, "running": False})

@app.route('/restart')
def restart_all():
    """Restart all phases by removing data files."""
    try:
        import glob
        
        files_to_remove = [
            "data/search_results.json",
            "data/extracted_links.json", 
            "data/website_contents.json",
            "data/combined_data.json",
            "data/validated_data.json",
            "data/final_results.json"
        ]
        
        # Also remove website content files
        content_files = glob.glob("data/website_content_*.json")
        files_to_remove.extend(content_files)
        
        # Remove log files
        log_files = glob.glob("data/phase*_last_run.log")
        files_to_remove.extend(log_files)
        
        for file in files_to_remove:
            if os.path.exists(file):
                os.remove(file)
                logger.info(f"Removed file: {file}")
        
        # Create data directory if it doesn't exist
        Path("data").mkdir(exist_ok=True)
        
        return redirect(url_for('index'))
    except Exception as e:
        logger.error(f"Error restarting all phases: {e}")
        return redirect(url_for('index'))

@app.route('/results')
def results():
    """View all valid FCA-approved broker/affiliate programs."""
    if not os.path.exists("data/final_results.json"):
        return redirect(url_for('index'))
    
    try:
        with open("data/final_results.json", 'r') as f:
            data = json.load(f)
            companies = data.get("results", [])
        
        return render_template('results.html', companies=companies)
    except Exception as e:
        logger.error(f"Error loading final results: {e}")
        return redirect(url_for('index'))

@app.route('/company/<int:index>')
def company_detail(index):
    """View detailed information about a specific company."""
    if not os.path.exists("data/final_results.json"):
        return redirect(url_for('index'))
    
    try:
        with open("data/final_results.json", 'r') as f:
            data = json.load(f)
            companies = data.get("results", [])
        
        if index < 0 or index >= len(companies):
            return redirect(url_for('results'))
        
        company = companies[index]
        return render_template('company_detail.html', company=company, index=index)
    except Exception as e:
        logger.error(f"Error loading company details: {e}")
        return redirect(url_for('results'))

@app.route('/run/<int:phase>', methods=['GET', 'POST'])
def run_phase(phase):
    """Run a specific phase of the FCA finder script and show logs."""
    if phase < 1 or phase > 6:
        return redirect(url_for('index'))
    
    phase_names = {
        1: "Search for companies",
        2: "Extract links",
        3: "Extract content",
        4: "Save content",
        5: "Validate entries",
        6: "Create final results"
    }
    phase_name = phase_names.get(phase, f"Phase {phase}")
    
    # For Phase 1, handle custom search queries if provided
    custom_queries = []
    auto_continue = False
    
    if request.method == 'POST':
        # Handle custom search queries for Phase 1
        if phase == 1:
            # Get custom queries from form
            query_text = request.form.get('custom_queries', '')
            if query_text.strip():
                # Split by newlines to get individual queries
                custom_queries = [q.strip() for q in query_text.split('\n') if q.strip()]
                logger.info(f"Received {len(custom_queries)} custom search queries")
            
            # Get single query mode setting
            single_query_mode = 'single_query_mode' in request.form
            logger.info(f"Single query mode: {single_query_mode}")
            
            # Get append mode setting
            append_mode = 'append_mode' in request.form
            logger.info(f"Append to existing results: {append_mode}")
        
        # Check if auto-continue is requested
        auto_continue = 'auto_continue' in request.form
        logger.info(f"Auto-continue through all phases: {auto_continue}")
    
    # Spawn a background thread to run the phase
    import threading
    
    def run_in_background():
        # Set up special logging that writes directly to the log file
        # so logs are available in real-time
        log_file = f"data/phase{phase}_last_run.log"
        
        # Clear previous log
        with open(log_file, 'w') as f:
            f.write(f"Starting phase {phase}: {phase_name}...\n")
        
        # Create file handler for this log file
        import logging as log_module
        file_handler = log_module.FileHandler(log_file, mode='a')
        file_handler.setLevel(log_module.INFO)
        formatter = log_module.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        
        # Add handler to logger
        root_logger = log_module.getLogger()
        root_logger.addHandler(file_handler)
        
        try:
            # Execute the current phase
            success = run_phase_internal(phase, root_logger, custom_queries)
            
            # If auto-continue is enabled and the phase completed successfully,
            # automatically run the next phase until all phases are complete
            next_phase = phase + 1
            while auto_continue and success and next_phase <= 6:
                root_logger.info(f"Auto-continuing to phase {next_phase}")
                success = run_phase_internal(next_phase, root_logger, custom_queries)
                next_phase += 1
                
            if auto_continue and next_phase > 6 and success:
                root_logger.info(f"All phases completed successfully with auto-continue!")
            elif not success:
                root_logger.warning(f"Auto-continue stopped due to a phase failure")
                
        except Exception as e:
            root_logger.error(f"Error running phases: {e}")
            root_logger.error(traceback.format_exc())
        finally:
            # Remove handler when done
            root_logger.removeHandler(file_handler)
            
    def run_phase_internal(current_phase, logger, custom_queries=None):
        """Internal function to run a specific phase and return success status."""
        try:
            # Get the form settings from the global Flask context if we're in a web request
            # or use defaults if running from command line
            single_query_mode = False
            append_mode = False
            
            # Check if we're in a request context (web app) or command line
            try:
                if current_phase == 1 and flask.has_request_context():
                    single_query_mode = 'single_query_mode' in flask.request.form
                    append_mode = 'append_mode' in flask.request.form
            except Exception as e:
                # If there's any error accessing request context, just use defaults
                logger.warning(f"Unable to access request form data, using defaults: {e}")
                # Keep the default values (False)
            
            # Use default parameters
            if current_phase == 1:
                # For search phase, use a higher max_pages for more thorough search
                logger.info(f"Running phase 1 with target of 1000 results")
                logger.info(f"Single query mode: {single_query_mode}")
                logger.info(f"Append mode: {append_mode}")
                
                if custom_queries:
                    logger.info(f"Using {len(custom_queries)} custom search queries: {custom_queries}")
                    phase1_search.run(
                        max_pages=20, 
                        custom_queries=custom_queries,
                        append_mode=append_mode,
                        single_query=single_query_mode
                    )
                else:
                    phase1_search.run(
                        max_pages=20,
                        append_mode=append_mode,
                        single_query=single_query_mode
                    )
            elif current_phase == 2:
                # For link extraction, process more links
                logger.info(f"Running phase 2 with 1000 max links")
                phase2_extract_links.run(max_links=1000)
            elif current_phase == 3:
                logger.info(f"Running phase 3: Extract content")
                phase3_extract_content.run(None)  # Process ALL links without limit
            elif current_phase == 4:
                logger.info(f"Running phase 4: Save content")
                phase4_save_content.run()
            elif current_phase == 5:
                logger.info(f"Running phase 5: Validate entries")
                phase5_validate.run()
            elif current_phase == 6:
                logger.info(f"Running phase 6: Create final results")
                phase6_create_final.run()
            
            logger.info(f"Phase {current_phase} completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error running phase {current_phase}: {e}")
            logger.error(traceback.format_exc())
            return False
    
    # Start the thread
    thread = threading.Thread(target=run_in_background)
    thread.daemon = True
    thread.start()
    
    # Return immediately to index page with a message that the phase is running
    return redirect(url_for('index'))

@app.route('/logs/<int:phase>')
def view_logs(phase):
    """View logs for a specific phase."""
    if phase < 1 or phase > 6:
        return redirect(url_for('index'))
    
    phase_names = {
        1: "Search for companies",
        2: "Extract links",
        3: "Extract content",
        4: "Save content",
        5: "Validate entries",
        6: "Create final results"
    }
    phase_name = phase_names.get(phase, f"Phase {phase}")
    
    log_file = f"data/phase{phase}_last_run.log"
    
    if os.path.exists(log_file):
        with open(log_file, 'r') as f:
            logs = f.read()
    else:
        logs = f"No logs found for {phase_name}. Run the phase first."
    
    return render_template('logs.html', phase=phase, phase_name=phase_name, logs=logs)

def create_directories():
    """Create necessary directories for data storage."""
    Path("data").mkdir(exist_ok=True)


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='FCA Broker/Affiliate Program Finder')
    parser.add_argument('--phase', type=int, choices=range(1, 7), help='Run a specific phase (1-6)')
    parser.add_argument('--search-query', type=str, default="FCA approved finance broker affiliate program", 
                        help='Search query for phase 1')
    parser.add_argument('--max-pages', type=int, default=20, 
                        help='Maximum number of search result pages to process per query')
    parser.add_argument('--max-links', type=int, default=1000, 
                        help='Maximum number of links to process')
    
    return parser.parse_args()


def check_env_variables():
    """Check if required environment variables are set."""
    required_vars = ['JINA_API_KEY', 'DEEPSEEK_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please check your .env file. See .env.example for reference.")
        return False
    
    return True


def main():
    """Main function to run the FCA finder script."""
    args = parse_arguments()
    create_directories()
    
    if not check_env_variables():
        return
    
    logger.info("Starting FCA Broker/Affiliate Program Finder")
    
    # If a specific phase is specified, run only that phase
    if args.phase:
        logger.info(f"Running phase {args.phase} only")
        phase_functions = {
            1: lambda: phase1_search.run(args.search_query, args.max_pages),
            2: lambda: phase2_extract_links.run(args.max_links),
            3: lambda: phase3_extract_content.run(None),  # Process ALL links, not just limited number
            4: lambda: phase4_save_content.run(),
            5: lambda: phase5_validate.run(),
            6: lambda: phase6_create_final.run()
        }
        phase_functions[args.phase]()
        logger.info(f"Phase {args.phase} completed")
        return
    
    # Otherwise run all phases in sequence
    logger.info("Running all phases sequentially")
    
    # Phase 1: Search for companies
    search_results = phase1_search.run(args.search_query, args.max_pages)
    
    # Phase 2: Extract links
    extracted_links = phase2_extract_links.run(args.max_links)
    
    # Phase 3: Extract content (Process ALL links)
    website_stats = phase3_extract_content.run(None)
    logger.info(f"Phase 3 completed with {website_stats['success']} successful extractions and {website_stats['error']} failures")
    
    # Phase 4: Save content
    phase4_save_content.run()
    
    # Phase 5: Validate entries
    validated_entries = phase5_validate.run()
    
    # Phase 6: Create final JSON
    final_results = phase6_create_final.run()
    
    logger.info(f"All phases completed. Final results saved to 'data/final_results.json'")
    logger.info(f"Found {len(final_results)} validated FCA-approved broker/affiliate programs")


if __name__ == "__main__":
    main()
