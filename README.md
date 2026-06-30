# Flask Microservice Backend

This repository contains a Flask-based backend with two microservice endpoints:
- A Content Service (`GET /api/v1/content/<page_slug>`)
- A Lead Capture Service (`POST /api/v1/leads`)

All endpoints are secured with API key authentication.

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

To use the API, you need to provide an API key in the `X-API-Key` header of your requests.
The required API key is `test-key`.

## Endpoints

### Content Service

-   **Endpoint:** `GET /api/v1/content/<page_slug>`
-   **Method:** `GET`
-   **Description:** Retrieves the content for a specific page.
-   **URL Params:**
    -   `page_slug=[string]` (e.g., "home", "about")
-   **Headers:**
    -   `X-API-Key: test-key`
-   **Example:**
    ```bash
    curl -X GET -H "X-API-Key: test-key" http://127.0.0.1:5000/api/v1/content/home
    ```

### Lead Capture Service

-   **Endpoint:** `POST /api/v1/leads`
-   **Method:** `POST`
-   **Description:** Captures a new lead.
-   **Headers:**
    -   `X-API-Key: test-key`
    -   `Content-Type: application/json`
-   **Body:**
    ```json
    {
      "email": "test@example.com",
      "name": "Test User"
    }
    ```
-   **Example:**
    ```bash
    curl -X POST -H "X-API-Key: test-key" -H "Content-Type: application/json" -d '{"email": "test@example.com", "name": "Test User"}' http://127.0.0.1:5000/api/v1/leads
    ```

## Running Tests

To run the tests, use pytest:

```bash
pytest
```