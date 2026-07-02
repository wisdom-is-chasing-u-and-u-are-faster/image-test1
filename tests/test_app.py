import os
import sys
# Ensure cloned repo path has priority over global paths to prevent importing agent's app module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from app import app, calculate_mismatch  # noqa: E402


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    with app.test_client() as client:
        yield client


def test_mismatch_calculator():
    # 0% mismatch when fields are identical
    assert calculate_mismatch("John Doe", "John Doe", "1990-01-01", "1990-01-01") == 0
    # Mismatch when DOB and name differ
    assert calculate_mismatch("John Doe", "Jonathan Doe", "1990-01-01", "1980-01-01") == 40
    # Mild mismatch when only name differs
    assert calculate_mismatch("John Doe", "Jonathan Doe", "1990-01-01", "1990-01-01") == 20


def test_onboarding_welcome_route(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Identity Verification" in response.data

    response = client.post('/welcome')
    assert response.status_code == 302
    assert response.headers['Location'] == '/registration'


def test_onboarding_registration_route(client):
    response = client.get('/registration')
    assert response.status_code == 200
    assert b"Personal Information" in response.data

    response = client.post('/registration', data={
        'fullname': 'Alice Smith',
        'dob': '1995-10-10',
        'address': '456 Oak Ave',
        'email': 'alice@example.com'
    })
    assert response.status_code == 302
    assert response.headers['Location'] == '/mfa-setup'


def test_onboarding_mfa_setup_route(client):
    response = client.get('/mfa-setup')
    assert response.status_code == 200
    assert b"Secure Your Account" in response.data

    response = client.post('/mfa-setup', data={'mfa_method': 'totp'})
    assert response.status_code == 302
    assert response.headers['Location'] == '/doc-select'


def test_onboarding_doc_select_route(client):
    response = client.get('/doc-select')
    assert response.status_code == 200
    assert b"Select Identity Document" in response.data

    response = client.post('/doc-select', data={'doc_type': 'passport'})
    assert response.status_code == 302
    assert response.headers['Location'] == '/doc-capture'


def test_onboarding_perfect_flow(client):
    # Perform full perfect scenario verification
    with client.session_transaction() as sess:
        sess['registered_data'] = {
            'fullname': 'Alice Smith',
            'dob': '1995-10-10',
            'address': '456 Oak Ave',
            'email': 'alice@example.com'
        }
        sess['doc_type'] = 'passport'

    # OCR Perfect capture
    response = client.post('/doc-capture', data={'scenario': 'perfect'})
    assert response.status_code == 302
    assert response.headers['Location'] == '/bio-scan'

    # Biometric match pass
    response = client.post('/bio-scan', data={'bio_scenario': 'pass'})
    assert response.status_code == 302
    assert response.headers['Location'] == '/review'

    # Review & submit
    response = client.post('/review')
    assert response.status_code == 302
    assert response.headers['Location'] == '/confirmation'

    # Verify confirmation page says Approved
    response = client.get('/confirmation')
    assert response.status_code == 200
    assert b"Application Approved" in response.data


def test_onboarding_mismatch_flow_manual_review(client):
    # Perform mismatch scenario verification
    with client.session_transaction() as sess:
        sess['registered_data'] = {
            'fullname': 'Alice Smith',
            'dob': '1995-10-10',
            'address': '456 Oak Ave',
            'email': 'alice@example.com'
        }
        sess['doc_type'] = 'passport'

    # OCR Mismatch capture
    response = client.post('/doc-capture', data={'scenario': 'mismatch'})
    assert response.status_code == 302

    # Biometric match pass
    response = client.post('/bio-scan', data={'bio_scenario': 'pass'})
    assert response.status_code == 302

    # Review & submit
    response = client.post('/review')
    assert response.status_code == 302

    # Verify confirmation page says Manual Review Required
    response = client.get('/confirmation')
    assert response.status_code == 200
    assert b"Manual Review Required" in response.data
