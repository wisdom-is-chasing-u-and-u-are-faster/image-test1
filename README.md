# Flask Microservice Backend

This repository contains a Flask-based backend with two microservice endpoints: a Content Service and a Lead Capture Service.

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

All API endpoints are secured and require an API key for access.

-   **Authentication:** The API key must be passed in the `X-API-Key` header of your HTTP request.

    `X-API-Key: <YOUR_API_KEY>`

    Contact the service administrator to obtain a valid API key.

## Endpoints

### 1. Content Service

-   **Endpoint:** `GET /api/v1/content/<page_slug>`
-   **Description:** Retrieves the content for a specific page.
-   **Example:**
    ```bash
    curl -X GET -H "X-API-Key: <YOUR_API_KEY>" http://127.0.0.1:5000/api/v1/content/home
    ```
-   **Success Response (200 OK):**
    ```json
    {
      "slug": "home",
      "title": "Welcome to the Home Page",
      "content": "This is the main content of the home page."
    }
    ```
-   **Error Response (404 Not Found):**
    ```json
    {
      "error": "Page not found"
    }
    ```

### 2. Lead Capture Service

-   **Endpoint:** `POST /api/v1/leads`
-   **Description:** Captures a new lead from a form submission.
-   **Example:**
    ```bash
    curl -X POST -H "X-API-Key: <YOUR_API_KEY>" -H "Content-Type: application/json" -d '''{
      "name": "John Doe",
      "email": "john.doe@example.com",
      "message": "I am interested in your services."
    }''' http://127.0.0.1:5000/api/v1/leads
    ```
-   **Success Response (201 Created):**
    ```json
    {
      "message": "Lead captured successfully"
    }
    ```

## Running Tests

This project uses `pytest` for testing.

1.  Make sure you have installed the development dependencies.
2.  Run the tests from the root of the project directory:
    ```bash
    pytest
    ```
