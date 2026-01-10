# Copilot Instructions for ShopUp E-Commerce Platform

## Project Overview

ShopUp is a full-stack e-commerce platform designed for African markets, specifically targeting Ghana and West Africa. It enables small business sellers to transition from social media to professional online storefronts.

## Technology Stack

### Frontend
- **HTML5, CSS3, JavaScript** (Vanilla - no frameworks)
- **Chart.js** for analytics visualization
- Responsive, mobile-first design

### Backend
- **Supabase** (PostgreSQL database)
- **Supabase Auth** for user authentication
- **Supabase Edge Functions** for serverless functions
- **Row Level Security (RLS)** policies

### Integrations
- **Paystack** - Payment processing
- **Resend** - Email notifications

## Project Structure

- `/customer/` - Customer-facing pages (login, registration, dashboard, orders)
- `/seller/` - Seller module (products, orders, analytics)
- `/admin/` - Admin panel (user management, platform analytics)
- `/css/` - Stylesheets
- `/js/` - JavaScript modules
- `/Backend/` - Backend-related files
- `*.sql` - Database schema files (run in numerical order)

## Coding Conventions

### JavaScript
- Use vanilla JavaScript (no frameworks)
- Use meaningful variable and function names
- Keep functions small and focused
- Use async/await for asynchronous operations
- Handle errors gracefully with try/catch blocks

### HTML
- Use semantic HTML5 elements
- Ensure accessibility with proper ARIA attributes
- Follow mobile-first responsive design principles

### CSS
- Use consistent naming conventions
- Organize styles logically
- Support responsive breakpoints

### SQL
- Use UPPERCASE for SQL keywords (SELECT, FROM, WHERE, etc.)
- Use snake_case for table and column names
- Always include Row Level Security (RLS) policies
- Add appropriate indexes for performance

## Configuration

Key configuration files:
- `supabase-config.js` - Supabase connection settings
- `paystack-config.js` - Payment gateway configuration
- `email-notifications.js` - Email service settings

## Ghana-Specific Features

When working on this codebase, consider:
- Mobile Money support (MTN, Vodafone, AirtelTigo)
- Ghana phone number validation (024, 054, 055, etc.)
- Digital address support
- Cash on Delivery payment option
- Local currency (GH₵)

## Testing

Refer to `TESTING_CHECKLIST.md` for comprehensive testing procedures including:
- Authentication tests
- Payment tests (test cards provided)
- Order flow tests
- Admin functionality tests

## Deployment

- Static hosting compatible (Netlify, Vercel, GitHub Pages)
- Database schemas must be run in numerical order in Supabase
- See `DEPLOYMENT_GUIDE.md` for detailed instructions

## Security Considerations

- Never commit API keys or secrets
- Always use Row Level Security (RLS) in Supabase
- Validate all user inputs
- Use HTTPS in production
- Follow PCI DSS compliance for payment handling (handled by Paystack)
