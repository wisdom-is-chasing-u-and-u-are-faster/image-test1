# Image Test API

This is a simple Flask application that provides an API for image testing. It requires an API key for authentication.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/wisdom-is-chasing-u-and-u-are-faster/image-test1.git
    cd image-test1
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

This API uses an `X-API-Key` for authentication. You need to include this header in your requests.

**Example:**
`X-API-Key: your-api-key`

## Endpoints

### Get Image

*   **URL:** `/`
*   **Method:** `GET`
*   **Headers:**
    *   `X-API-Key`: your-api-key
*   **Success Response:**
    *   **Code:** 200
    *   **Content:** `{ "message": "Authenticated and image processed" }`
*   **Error Response:**
    *   **Code:** 401
    *   **Content:** `{ "error": "Unauthorized" }`

## Running Tests

This project uses `pytest` for testing.

To run the tests, execute the following command:
```bash
pytest
```
