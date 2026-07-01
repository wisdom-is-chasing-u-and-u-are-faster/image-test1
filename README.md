# Image Test1 Flask Backend

This repository contains a Flask-based backend with two microservice endpoints:

*   **Content Service**: `GET /api/v1/content/<page_slug>`
*   **Lead Capture Service**: `POST /api/v1/leads`

All endpoints are secured with API key authentication.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/wisdom-is-chasing-u-and-u-are-faster/image-test1.git
    cd image-test1
    ```
2.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

To use the API, you need to provide an API key via the `X-API-Key` HTTP header.

## Endpoints

### Content Service

*   **Endpoint**: `GET /api/v1/content/<page_slug>`
*   **Description**: Retrieves content for a given page slug.
*   **Example**:
    ```bash
    curl -H "X-API-Key: your-api-key" http://127.0.0.1:5000/api/v1/content/home
    ```

### Lead Capture Service

*   **Endpoint**: `POST /api/v1/leads`
*   **Description**: Captures lead data.
*   **Example**:
    ```bash
    curl -X POST \
      -H "Content-Type: application/json" \
      -H "X-API-Key: your-api-key" \
      -d '{\'\'\'name\'\'\': \'\'\'John Doe\'\'\', \'\'\'email\'\'\': \'\'\'john.doe@example.com\'\'\'}' \
      http://127.0.0.1:5000/api/v1/leads
    ```

## Running Tests

To run the tests, use pytest:

```bash
pytest
```
