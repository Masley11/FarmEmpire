
#!/usr/bin/env python3
import http.server
import socketserver
import os
from http.server import SimpleHTTPRequestHandler

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        mimetype = super().guess_type(path)
        if path.endswith('.js'):
            return 'application/javascript'
        return mimetype

PORT = 5000
Handler = MyHTTPRequestHandler

print(f"🌐 Serveur démarré sur http://0.0.0.0:{PORT}")
print(f"📱 Votre jeu est accessible via l'URL de votre Repl")
print(f"🔄 Les changements seront visibles après actualisation du navigateur")

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté")
        httpd.shutdown()
