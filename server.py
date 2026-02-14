#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Get the file path
        file_path = Path(self.translate_path(self.path))
        
        # If it's a real file, serve it
        if file_path.exists() and file_path.is_file():
            return super().do_GET()
        
        # Otherwise, serve index.html for SPA routing
        self.path = '/index.html'
        return super().do_GET()

os.chdir(r'c:\Users\PandraVamsi\OneDrive\Desktop\KP\design-system')

PORT = 8000
with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    httpd.serve_forever()
