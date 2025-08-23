#!/usr/bin/env python3
"""
Monitor Hunter search in real-time to diagnose issues.
"""

import asyncio
import psutil
import time
import os
from datetime import datetime
from collections import deque

class HunterMonitor:
    def __init__(self):
        self.dns_errors = deque(maxlen=100)
        self.api_calls = deque(maxlen=100)
        self.convex_errors = deque(maxlen=50)
        self.start_time = time.time()
        
    def log_dns_error(self, error_msg):
        self.dns_errors.append({
            'time': datetime.now(),
            'error': error_msg
        })
    
    def log_api_call(self, api_type, success, duration):
        self.api_calls.append({
            'time': datetime.now(),
            'api': api_type,
            'success': success,
            'duration': duration
        })
    
    def log_convex_error(self, error_msg):
        self.convex_errors.append({
            'time': datetime.now(),
            'error': error_msg
        })
    
    def get_stats(self):
        """Get current statistics."""
        now = time.time()
        runtime = now - self.start_time
        
        # Calculate rates
        recent_apis = [c for c in self.api_calls if (now - c['time'].timestamp()) < 60]
        search_calls = [c for c in recent_apis if c['api'] == 'search']
        reader_calls = [c for c in recent_apis if c['api'] == 'reader']
        
        # Calculate success rates
        search_success = [c for c in search_calls if c['success']]
        reader_success = [c for c in reader_calls if c['success']]
        
        # System stats
        process = psutil.Process()
        
        return {
            'runtime': runtime,
            'system': {
                'cpu_percent': psutil.cpu_percent(interval=0.1),
                'memory_percent': psutil.virtual_memory().percent,
                'process_memory_mb': process.memory_info().rss / 1024 / 1024,
                'connections': len(process.connections()),
                'threads': process.num_threads()
            },
            'api': {
                'search_rpm': len(search_calls),
                'reader_rpm': len(reader_calls),
                'search_success_rate': len(search_success) / len(search_calls) * 100 if search_calls else 0,
                'reader_success_rate': len(reader_success) / len(reader_calls) * 100 if reader_calls else 0
            },
            'errors': {
                'dns_errors_total': len(self.dns_errors),
                'dns_errors_recent': len([e for e in self.dns_errors if (now - e['time'].timestamp()) < 60]),
                'convex_errors_total': len(self.convex_errors),
                'convex_errors_recent': len([e for e in self.convex_errors if (now - e['time'].timestamp()) < 60])
            }
        }
    
    def print_dashboard(self):
        """Print monitoring dashboard."""
        stats = self.get_stats()
        
        # Clear screen
        os.system('clear' if os.name == 'posix' else 'cls')
        
        print("="*80)
        print(f"Hunter Search Monitor - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Runtime: {stats['runtime']:.0f}s")
        print("="*80)
        
        print("\n📊 SYSTEM RESOURCES:")
        print(f"  CPU: {stats['system']['cpu_percent']:.1f}%")
        print(f"  Memory: {stats['system']['memory_percent']:.1f}%")
        print(f"  Process Memory: {stats['system']['process_memory_mb']:.1f} MB")
        print(f"  Connections: {stats['system']['connections']}")
        print(f"  Threads: {stats['system']['threads']}")
        
        print("\n🌐 API USAGE (last 60s):")
        print(f"  Search API: {stats['api']['search_rpm']} calls/min (limit: 100)")
        print(f"  Reader API: {stats['api']['reader_rpm']} calls/min (limit: 500)")
        print(f"  Search Success Rate: {stats['api']['search_success_rate']:.1f}%")
        print(f"  Reader Success Rate: {stats['api']['reader_success_rate']:.1f}%")
        
        # Rate limit warnings
        if stats['api']['search_rpm'] > 90:
            print("  ⚠️  WARNING: Approaching Search API rate limit!")
        if stats['api']['reader_rpm'] > 450:
            print("  ⚠️  WARNING: Approaching Reader API rate limit!")
        
        print("\n❌ ERRORS:")
        print(f"  DNS Errors (total): {stats['errors']['dns_errors_total']}")
        print(f"  DNS Errors (last 60s): {stats['errors']['dns_errors_recent']}")
        print(f"  Convex Errors (total): {stats['errors']['convex_errors_total']}")
        print(f"  Convex Errors (last 60s): {stats['errors']['convex_errors_recent']}")
        
        # Recent errors
        if self.dns_errors:
            print("\n  Recent DNS Errors:")
            for error in list(self.dns_errors)[-3:]:
                print(f"    {error['time'].strftime('%H:%M:%S')} - {error['error'][:60]}...")
        
        if self.convex_errors:
            print("\n  Recent Convex Errors:")
            for error in list(self.convex_errors)[-3:]:
                print(f"    {error['time'].strftime('%H:%M:%S')} - {error['error'][:60]}...")
        
        print("\n💡 RECOMMENDATIONS:")
        if stats['errors']['dns_errors_recent'] > 5:
            print("  • DNS errors detected - reduce concurrent connections")
        if stats['api']['search_rpm'] > 80:
            print("  • High Search API usage - increase delay between requests")
        if stats['api']['reader_rpm'] > 400:
            print("  • High Reader API usage - reduce batch size")
        if stats['system']['memory_percent'] > 80:
            print("  • High memory usage - consider restarting the service")

async def monitor():
    """Run the monitor."""
    monitor = HunterMonitor()
    
    print("Starting Hunter Search Monitor...")
    print("This will display real-time statistics. Press Ctrl+C to stop.")
    print("\nWaiting for data...")
    
    while True:
        try:
            monitor.print_dashboard()
            await asyncio.sleep(2)  # Update every 2 seconds
        except KeyboardInterrupt:
            print("\n\nMonitor stopped.")
            break

if __name__ == "__main__":
    asyncio.run(monitor())