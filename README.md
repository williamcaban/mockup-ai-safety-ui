# AI Safety Studio prototype

PatternFly React v6 prototype for managing application safety profiles, policies, guardrails, evaluations, and monitoring. All displayed records and metrics are illustrative; the prototype does not connect to ASAGO, EvalHub, NeMo Guardrails, OpenTelemetry, or MLflow.

## Run locally

From this directory:

```sh
npm --prefix frontend install
npm --prefix frontend run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:5173>. To create a production build, run `npm --prefix frontend run build`.
