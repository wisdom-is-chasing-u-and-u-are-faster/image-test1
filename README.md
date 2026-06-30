# Flask Microservice Backend

This repository contains a Flask-based backend with two microservice endpoints for content and lead capture.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wisdom-is-chasing-u-and-u-are-faster/image-test1.git
    cd image-test1
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

The API endpoints are secured using an API key. To authenticate your requests, you must include an `X-API-Key` header with your secret key.

```
X-API-Key: YOUR_SECRET_API_KEY
```

## API Endpoints

### 1. Content Service

-   **Endpoint:** `GET /api/v1/content/<page_slug>`
-   **Description:** Retrieves content for a given page slug.
-   **Example using `curl`:**
    ```bash
    curl -X GET -H "X-API-Key: YOUR_SECRET_API_KEY" http://127.0.0.1:5000/api/v1/content/about-us
    ```

### 2. Lead Capture Service

-   **Endpoint:** `POST /api/v1/leads`
-   **Description:** Captures a new lead from a form submission.
-   **Request Body (JSON):**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "message": "I'm interested in your services."
    }
    ```
-   **Example using `curl`:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "X-API-Key: YOUR_SECRET_API_KEY" -d '{"name": "John Doe", "email": "john.doe@example.com"}' http://127.0.0.1:5000/api/v1/leads
    ```

## Running the Application

To run the Flask development server:
```bash
flask run
```

## Testing

This project uses `pytest` for testing. To run the test suite:

1.  Make sure you have installed the development dependencies.
2.  Run the tests from the root of the project directory:
    ```bash
    pytest
    ```
