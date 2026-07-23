import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

describe('Blood Donor Connection Network (BDCN) SPA integration tests', () => {

  test('A donor can successfully register and log in to the mobile app', async () => {
    render(<App />);

    // 1. We are initially on the DonorLogin page
    expect(screen.getByText(/Donor Registered Email/i)).toBeInTheDocument();
    
    // 2. Navigate to Register
    const registerBtn = screen.getByRole('button', { name: /Register here/i });
    fireEvent.click(registerBtn);
    expect(screen.getByText(/Create Donor Profile/i)).toBeInTheDocument();

    // 3. Complete registration form
    fireEvent.change(screen.getByPlaceholderText('Jane Doe'), { target: { value: 'Alice Green' } });
    fireEvent.change(screen.getByPlaceholderText('jane@gmail.com'), { target: { value: 'alice@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('555-0155'), { target: { value: '555-0211' } });
    
    // Submit registration
    const submitRegBtn = screen.getByRole('button', { name: /Complete Registration/i });
    fireEvent.click(submitRegBtn);

    // 4. Verify we are logged in and dashboard displays the donor's name
    expect(screen.getByText('Alice Green')).toBeInTheDocument();
    expect(screen.getByText('My Eligibility Status')).toBeInTheDocument();
  });

  test('The mobile app dashboard correctly displays eligibility status and upcoming appointments', () => {
    render(<App />);

    // Click quick demo account for John Doe (Eligible)
    const demoBtn = screen.getByRole('button', { name: /John Doe \(O\+\) - Eligible/i });
    fireEvent.click(demoBtn);

    // Click Log In
    const loginBtn = screen.getByRole('button', { name: /Log In securely/i });
    fireEvent.click(loginBtn);

    // Verify Eligibility status and upcoming appointments display
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Eligible')).toBeInTheDocument();
    expect(screen.getByText('Group O+')).toBeInTheDocument();
    expect(screen.getByText('No appointments scheduled. Walk-ins and Emergency responses are always welcome.')).toBeInTheDocument();
  });

  test('A hospital staff member can log in to the web portal and successfully submit a blood request', () => {
    render(<App />);

    // Login on the Staff Portal side
    const loginStaffBtn = screen.getByRole('button', { name: /Sign In as Hospital Coordinator/i });
    fireEvent.click(loginStaffBtn);

    // Verify Hospital request dashboard is displayed
    expect(screen.getByText('Hospital Request Console')).toBeInTheDocument();
    expect(screen.getByText('New Outbound Blood Order')).toBeInTheDocument();

    // Fill in a new request
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    
    // Submit the request
    const submitReqBtn = screen.getByRole('button', { name: /Submit HL7 Blood Request/i });
    fireEvent.click(submitReqBtn);

    // Verify request appeared in active list
    expect(screen.getByText('Request Submitted Successfully! Broadcasting match alerts...')).toBeInTheDocument();
    expect(screen.getByText(/Units: 4/i)).toBeInTheDocument();
  });

  test('A blood bank manager can log in and view dashboard with anonymized regional data and inventory', () => {
    render(<App />);

    // Login as Blood Bank Manager
    const loginManagerBtn = screen.getByRole('button', { name: /Sign In as Blood Bank Manager/i });
    fireEvent.click(loginManagerBtn);

    // Verify dashboard elements are displayed
    expect(screen.getByText('Blood Bank Regional Control')).toBeInTheDocument();
    expect(screen.getByText('Total Regional Stocks')).toBeInTheDocument();
    expect(screen.getByText('Anonymized Inventory Stockpiles')).toBeInTheDocument();
    expect(screen.getByText('Anonymized Donor Statistics')).toBeInTheDocument();

    // Verify no direct PII (emails or phone numbers of donors) are displayed on the staff dashboard
    expect(screen.queryByText('john@gmail.com')).not.toBeInTheDocument();
    expect(screen.queryByText('555-0199')).not.toBeInTheDocument();
  });

  test('A donor receives and can accept an emergency push notification, which then reserves an appointment', () => {
    render(<App />);

    // 1. Log in John Doe on mobile
    const demoBtn = screen.getByRole('button', { name: /John Doe \(O\+\) - Eligible/i });
    fireEvent.click(demoBtn);
    const loginBtn = screen.getByRole('button', { name: /Log In securely/i });
    fireEvent.click(loginBtn);

    // 2. Go to Alerts tab
    const alertsTab = screen.getByRole('button', { name: /Alerts/i });
    fireEvent.click(alertsTab);

    // 3. See active alert
    expect(screen.getByText('EMERGENCY CALL')).toBeInTheDocument();
    expect(screen.getByText(/URGENT: O- blood needed immediately/i)).toBeInTheDocument();

    // 4. Click Accept
    const acceptBtn = screen.getByRole('button', { name: /Accept & Book Appointment/i });
    fireEvent.click(acceptBtn);

    // 5. Verify instant reservation slot confirmation and GPS Routing Map
    expect(screen.getByText('Reservation Confirmed! Slot booked for today.')).toBeInTheDocument();
    expect(screen.getByText('Clinic GPS Routing (Live)')).toBeInTheDocument();
  });

});
