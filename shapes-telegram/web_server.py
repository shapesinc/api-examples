#!/usr/bin/env python3
"""
Simple flask web server to satisfy Replit deployment requirements
"""
from app import app, run_waitress

if __name__ == "__main__":
    # Run the Flask app with waitress
    run_waitress()