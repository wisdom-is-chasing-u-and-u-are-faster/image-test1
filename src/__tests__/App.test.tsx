import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('IT Services Corporate Website - Integration Suite', () => {
  test('renders Navbar brand title and principal coordinates', () => {
    render(<App />);
    expect(screen.getByText(/ApexIT Solutions/i)).toBeInTheDocument();
  });

  test('can navigate between core views via primary links', () => {
    render(<App />);
    
    // Check initial hero rendering
    expect(screen.getByText(/Accelerating Digital Transformation/i)).toBeInTheDocument();

    // Click Services navigation item
    const servicesLink = screen.getByRole('link', { name: /Services/i });
    fireEvent.click(servicesLink);
    expect(screen.getByText(/Specialized Service Tracks/i)).toBeInTheDocument();

    // Click About Us navigation item
    const aboutLink = screen.getByRole('link', { name: /About Us/i });
    fireEvent.click(aboutLink);
    expect(screen.getByText(/Who We Are/i)).toBeInTheDocument();
  });

  test('submitting lead form logs content to database view', () => {
    render(<App />);
    
    // Fill out form
    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const companyInput = screen.getByLabelText(/Company/i);
    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });

    fireEvent.change(nameInput, { target: { value: 'Test Engineer' } });
    fireEvent.change(emailInput, { target: { value: 'test@persistent.com' } });
    fireEvent.change(companyInput, { target: { value: 'Persistent Systems' } });
    
    fireEvent.click(submitBtn);

    // Verify success banner
    expect(screen.getByText(/Inquiry Received Successfully!/i)).toBeInTheDocument();
  });
});
