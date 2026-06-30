# Flask Microservice Backend

This repository contains a Flask-based backend with two microservice endpoints: a Content Service and a Lead Capture Service. All endpoints are secured with API key authentication.

## Installation

To install the necessary dependencies, run the following command:

```bash
pip install -r requirements.txt
```

## Configuration

This application uses API key-based authentication. You must provide an API key in the `X-API-Key` header for all requests.

The expected API key is currently hardcoded in `app.py`. For a production environment, you should use a more secure method for managing API keys, such as environment variables or a secrets management service.

## Endpoints

### Content Service

*   **Endpoint**: `GET /api/v1/content/<page_slug>`
*   **Description**: Retrieves content for a given page slug.
*   **Example**:

```bash
curl -X GET -H "X-API-Key: your-api-key" http://127.0.0.1:5000/api/v1/content/home
```

### Lead Capture Service

*   **Endpoint**: `POST /api/v1/leads`
*   **Description**: Captures lead information.
*   **Example**:

```bash
curl -X POST -H "Content-Type: application/json" -H "X-API-Key: your-api-key" -d '''{"email": "test@example.com", "name": "Test User"}''' http://127.0.0.1:5000/api/v1/leads
```

## Testing

To run the test suite, use `pytest`:

```bash
pytest
```
