import http.server
import socketserver
from os import listdir
from os.path import isfile, join
from random import choice

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/image', '/image/'):
            files = [f for f in listdir('./image') if isfile(join('./image', f))]

            if len(files) == 0:
                return self.send_error(404, "No files in image folder")

            img = choice(files)
            self.path = f'/image/{img}'
            
        super().do_GET()

    def send_header(self, keyword, value):
        if keyword.lower() not in ('last-modified', 'etag'):
            super().send_header(keyword, value)

    def end_headers(self):
        if self.path.startswith('/image'):
            self.send_header('Cache-Control', 'no-cache, no store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')

        super().end_headers()
    
port = 8383

server = socketserver.TCPServer(("", port), CustomHandler)

try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
    exit()
