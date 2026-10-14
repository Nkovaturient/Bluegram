# Bluegram stats

From this directory:

```
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

`GET /api/regions` · `GET /api/trend?region=arctic`
