# Flask Microservice Backend

This repository contains a Flask-based backend with two microservice endpoints: a Content Service and a Lead Capture Service. All endpoints are secured with API key authentication.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/wisdom-is-chasing-u-and-u-are-faster/image-test1.git
    cd image-test1
    ```

2.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

To access the API endpoints, you must provide an API key via the `X-API-Key` HTTP header.

The required API key is hardcoded in the `app.py` file. For a production environment, you should use a more secure method of storing and retrieving secrets.

## Endpoints

### Content Service

*   **Endpoint:** `GET /api/v1/content/<page_slug>`
*   **Description:** Retrieves content for a given page slug.
*   **Example:**
    ```bash
    curl -X GET -H "X-API-Key: your-api-key" http://127.0.0.1:5000/api/v1/content/home
    ```

### Lead Capture Service

*   **Endpoint:** `POST /api/v1/leads`
*   **Description:** Captures lead information.
*   **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "X-API-Key: your-api-key" -d '{'\''name'\'': '\''John Doe'\'', '\''email'\'': '\''john.doe@example.com'\''}' http://127.0.0.1:5000/api/v1/leads
    ```

## Testing

To run the tests, use `pytest`:

```bash
pytest
```
