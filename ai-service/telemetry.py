
import os

from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
    OTLPSpanExporter,
)
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import make_asgi_app
from opentelemetry import metrics



def setup_telemetry(app):
    meter = metrics.get_meter("tenantai.ai-service")

    ai_requests_total = meter.create_counter(
        "tenantai_ai_requests_total",
        description="Total AI prediction requests",
        unit="{request}",
    )

    ai_request_duration = meter.create_histogram(
        "tenantai_ai_request_duration_ms",
        description="AI prediction request duration in milliseconds",
        unit="ms",
    )
    resource = Resource.create(
        {
            "service.name": "tenantai-ai-service",
            "deployment.environment.name": "development",
        }
    )

    # Distributed tracing: export traces to Jaeger.
    tracer_provider = TracerProvider(resource=resource)

    trace_exporter = OTLPSpanExporter(
        endpoint=os.getenv(
            "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
            "http://localhost:4318/v1/traces",
        )
    )

    tracer_provider.add_span_processor(
        BatchSpanProcessor(trace_exporter)
    )
    trace.set_tracer_provider(tracer_provider)

    # Metrics: expose measurements in Prometheus format.
    metric_reader = PrometheusMetricReader()
    meter_provider = MeterProvider(
        resource=resource,
        metric_readers=[metric_reader],
    )
    metrics.set_meter_provider(meter_provider)

    # Instrument FastAPI requests for tracing.
    FastAPIInstrumentor.instrument_app(app)

    # Expose the Prometheus metrics endpoint.
    app.mount("/metrics", make_asgi_app())
