# Corporate Website Development — ARCH-3119

This repository contains the source code for the new corporate website, implemented as a lightweight, clean Python Flask application. It features responsive page navigation across multiple corporate divisions and administrative tools, backed by a complete test suite.

---

## 🛠️ Tech Stack
- **Web Framework:** [Flask](https://flask.palletsprojects.com/) (Python)
- **Testing:** [pytest](https://docs.pytest.org/)
- **Linting:** [flake8](https://flake8.pycqa.org/) with `autopep8` formatting
- **Static Typing:** [mypy](https://mypy-lang.org/)

---

## 📂 Project Structure
```
├── app.py                  # Main Flask application with mapped routes
├── requirements.txt        # Declared project dependencies
├── README.md               # Project documentation
├── templates/              # HTML Templates (Responsive UI Layouts)
│   ├── home.html           # Home page
│   ├── about.html          # About Us page
│   ├── products.html       # Products / Services listings
│   ├── services.html       # Dynamic services details
│   ├── blog.html           # Blog archive list
│   ├── blog-post.html      # Full-view blog post reader
│   ├── contact.html        # Interactive Contact Us form (with client-side script)
│   ├── admin-login.html    # Secure Administrator Login screen
│   └── admin-dashboard.html# Content Management Area
└── tests/
    └── test_app.py         # Complete pytest integration tests
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Python 3.11+** installed locally.

### 2. Install Dependencies
Clone the repository and install the project requirements in your environment:
```bash
pip install -r requirements.txt
```

### 3. Run the Application
Start the Flask development server:
```bash
python app.py
```
By default, the application will be hosted at `http://localhost:5000`. Open this URL in any modern web browser to navigate the pages.

---

## 🧪 Verification & Quality Control

### Running Unit Tests
To run the pytest integration test suite and verify that all 10 route checkpoints are fully functional:
```bash
pytest tests/test_app.py -v
```

### Running the Linter
To enforce PEP8 code formatting style and clean imports:
```bash
flake8 app.py tests/test_app.py --max-line-length=120
```

### Running Static Type Checks
To run the mypy type annotations check:
```bash
mypy app.py --ignore-missing-imports
```
