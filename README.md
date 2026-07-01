# Image Test1 Flask Application

This is a simple Flask application that provides two microservice endpoints: a Content Service and a Lead Capture Service.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wisdom-is-chasing-u-and-u-are-faster/image-test1.git
    cd image-test1
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

This application uses API key-based authentication. To access the protected endpoints, you need to provide a valid API key in the `X-API-Key` header of your request.

The valid API key is hardcoded in the application for demonstration purposes. You can find it in the `app.py` file.

## Endpoints

### 1. Content Service

*   **Endpoint:** `GET /api/v1/content/<page_slug>`
*   **Description:** Retrieves content for a given page slug.
*   **Authentication:** Requires a valid API key in the `X-API-Key` header.
*   **Example:**
    ```bash
    curl -X GET -H "X-API-Key: your-api-key" http://127.0.0.1:5000/api/v1/content/home
    ```

### 2. Lead Capture Service

*   **Endpoint:** `POST /api/v1/leads`
*   **Description:** Captures lead information.
*   **Authentication:** Requires a valid API key in the `X-API-Key` header.
*   **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "X-API-Key: your-api-key" -d '{"email": "test@example.com", "name": "Test User"}' http://127.0.0.1:5000/api/v1/leads
    ```

## Running the Application

To run the application, use the following command:

```bash
flask run
```

The application will be running at `http://127.0.0.1:5000`.

## Running Tests

This project uses `pytest` for testing. To run the tests, use the following command:

```bash
pytest
```
