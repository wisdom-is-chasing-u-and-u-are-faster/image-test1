import os
import secrets
from flask import Flask, render_template, request, redirect, session

app = Flask(__name__)
# Secure session secret key
app.secret_key = os.environ.get("FLASK_SECRET_KEY", secrets.token_hex(24))


def calculate_mismatch(registered_name, ocr_name, registered_dob, ocr_dob):
    """
    Calculates a percentage mismatch score between registered data and OCR data.
    If names or DOBs mismatch, we compute a mismatch percentage.
    """
    if not registered_name or not ocr_name:
        return 100

    # Clean and compare names
    reg_n = registered_name.strip().lower()
    ocr_n = ocr_name.strip().lower()

    # A simple mismatch indicator
    if reg_n == ocr_n and registered_dob == ocr_dob:
        return 0
    elif reg_n != ocr_n and registered_dob != ocr_dob:
        return 40  # Well above the 15% threshold
    else:
        return 20  # Above 15% threshold


@app.route('/')
@app.route('/welcome', methods=['GET', 'POST'])
def welcome():
    session.clear()
    if request.method == 'POST':
        session['onboarding_step'] = 2
        return redirect('/registration')
    return render_template('welcome.html', step_num=1)


@app.route('/registration', methods=['GET', 'POST'])
def registration():
    if request.method == 'POST':
        session['registered_data'] = {
            'fullname': request.form.get('fullname', ''),
            'dob': request.form.get('dob', ''),
            'address': request.form.get('address', ''),
            'email': request.form.get('email', '')
        }
        session['onboarding_step'] = 3
        return redirect('/mfa-setup')

    form_data = session.get('registered_data', {})
    return render_template('registration.html', step_num=2, form_data=form_data)


@app.route('/mfa-setup', methods=['GET', 'POST'])
def mfa_setup():
    if request.method == 'POST':
        session['mfa_method'] = request.form.get('mfa_method', 'totp')
        session['onboarding_step'] = 4
        return redirect('/doc-select')
    return render_template('mfa-setup.html', step_num=3)


@app.route('/doc-select', methods=['GET', 'POST'])
def doc_select():
    if request.method == 'POST':
        session['doc_type'] = request.form.get('doc_type', 'passport')
        session['onboarding_step'] = 5
        return redirect('/doc-capture')
    return render_template('doc-select.html', step_num=4)


@app.route('/doc-capture', methods=['GET', 'POST'])
def doc_capture():
    doc_type = session.get('doc_type', 'passport')
    if request.method == 'POST':
        scenario = request.form.get('scenario', 'perfect')
        session['scenario'] = scenario

        # Simulate 3rd Party OCR extraction
        reg_data = session.get('registered_data', {})
        if scenario == 'perfect':
            session['ocr_data'] = {
                'fullname': reg_data.get('fullname', 'John Doe'),
                'dob': reg_data.get('dob', '1990-01-01'),
                'address': reg_data.get('address', '123 Main St')
            }
        else:
            session['ocr_data'] = {
                'fullname': 'Jonathan Doe-Smith',
                'dob': '1980-05-15',
                'address': '999 Alternative Blvd'
            }
        session['onboarding_step'] = 6
        return redirect('/bio-scan')
    return render_template('doc-capture.html', step_num=5, doc_type=doc_type)


@app.route('/bio-scan', methods=['GET', 'POST'])
def bio_scan():
    if request.method == 'POST':
        bio_scenario = request.form.get('bio_scenario', 'pass')
        if bio_scenario == 'pass':
            session['bio_data'] = {
                'match_score': 98,
                'liveness': True
            }
        else:
            session['bio_data'] = {
                'match_score': 45,
                'liveness': False
            }
        session['onboarding_step'] = 7
        return redirect('/review')
    return render_template('bio-scan.html', step_num=6)


@app.route('/review', methods=['GET', 'POST'])
def review():
    registered = session.get('registered_data', {})
    ocr = session.get('ocr_data', {})
    bio = session.get('bio_data', {'match_score': 0, 'liveness': False})

    mismatch_score = calculate_mismatch(
        registered.get('fullname'), ocr.get('fullname'),
        registered.get('dob'), ocr.get('dob')
    )

    # If biometric failed, also trigger high mismatch/review
    if not bio.get('liveness', False):
        mismatch_score = max(mismatch_score, 50)

    mismatch_fields = {
        'fullname': registered.get('fullname') != ocr.get('fullname'),
        'dob': registered.get('dob') != ocr.get('dob')
    }

    if request.method == 'POST':
        # Route to Manual Review or Auto-Approved based on 15% threshold
        if mismatch_score > 15:
            session['final_status'] = 'Manual Review'
        else:
            session['final_status'] = 'Approved'

        session['mismatch_score'] = mismatch_score
        session['ref_id'] = f"AEGIS-{secrets.token_hex(4).upper()}"
        session['onboarding_step'] = 8
        return redirect('/confirmation')

    return render_template(
        'review.html', step_num=7, registered=registered, ocr=ocr,
        bio=bio, mismatch_score=mismatch_score, mismatch_fields=mismatch_fields
    )


@app.route('/confirmation')
def confirmation():
    status = session.get('final_status', 'Manual Review')
    ref_id = session.get('ref_id', 'AEGIS-UNKNOWN')
    mismatch_score = session.get('mismatch_score', 0)
    bio = session.get('bio_data', {'match_score': 0, 'liveness': False})
    return render_template(
        'confirmation.html', step_num=8, status=status,
        ref_id=ref_id, mismatch_score=mismatch_score, bio=bio
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
