
from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class AlertHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/alerts":
            self.send_error(404, "Not found")
            return

        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        print("\nReceived Alertmanager notification:")

        for alert in payload.get("alerts", []):
            labels = alert.get("labels", {})
            annotations = alert.get("annotations", {})

            print({
                "status": alert.get("status"),
                "alertname": labels.get("alertname"),
                "severity": labels.get("severity"),
                "summary": annotations.get("summary"),
            })

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"received"}')

    def log_message(self, format_string, *args):
        print(f"Webhook HTTP: {format_string % args}")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 9099), AlertHandler)
    print("TenantAI webhook receiver listening on port 9099")
    server.serve_forever()
