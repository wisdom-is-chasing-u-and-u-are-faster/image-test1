# Corporate Website Backend

This is a Flask-based backend for a corporate website. It provides two microservice endpoints: a Content Service and a Lead Capture Service.

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

This application uses API key-based authentication. The API key must be provided in the `X-API-Key` header of each request.

By default, the API key is `test-api-key-123`. You can set a different API key by setting the `API_KEY` environment variable:

```bash
export API_KEY='your-secret-api-key'
```

## Running the Application

To run the Flask development server:

```bash
python app.py
```

The application will be available at `http://localhost:5000`.

## API Endpoints

### Content Service

*   **Endpoint**: `GET /api/v1/content/<page_slug>`
*   **Description**: Retrieves content for a given page.
*   **Authentication**: Requires a valid `X-API-Key` header.
*   **Example Request**:
    ```bash
    curl -X GET -H "X-API-Key: test-api-key-123" http://localhost:5000/api/v1/content/home
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "title": "Welcome to Our Corporate Website",
      "tagline": "Innovating the future of microservices.",
      "content": "This is the home page of our enterprise application platform."
    }
    ```
*   **Failure Response** (404 Not Found):
    ```json
    {
      "error": "Page not found"
    }
    ```

### Lead Capture Service

*   **Endpoint**: `POST /api/v1/leads`
*   **Description**: Captures lead details from a contact form.
*   **Authentication**: Requires a valid `X-API-Key` header.
*   **Example Request**:
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "X-API-Key: test-api-key-123" -d '{"name": "John Doe", "email": "john.doe@example.com"}' http://localhost:5000/api/v1/leads
    ```
*   **Success Response** (201 Created):
    ```json
    {
      "lead_id": "a-unique-uuid"
    }
    ```
*   **Failure Response** (400 Bad Request):
    ```json
    {
      "error": "Missing required fields: 'name' and 'email' are required"
    }
    ```

## Running Tests

This project uses `pytest` for testing. To run the tests:

```bash
pytest
```
