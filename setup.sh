#!/bin/bash

# ============================================
# SHOPUP QUICK SETUP SCRIPT
# ============================================
# This script helps you configure ShopUp quickly
# Run this after downloading all files
# ============================================

echo "🛍️  SHOPUP QUICK SETUP"
echo "===================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# ============================================
# STEP 1: CHECK PREREQUISITES
# ============================================

echo "Step 1: Checking prerequisites..."
echo ""

# Check if git is installed
if command -v git &> /dev/null; then
    print_success "Git is installed"
else
    print_warning "Git is not installed (optional)"
fi

# Check if node/npm is installed
if command -v node &> /dev/null; then
    print_success "Node.js is installed: $(node --version)"
else
    print_warning "Node.js is not installed (needed for Supabase CLI)"
fi

echo ""

# ============================================
# STEP 2: COLLECT CONFIGURATION
# ============================================

echo "Step 2: Configuration Setup"
echo ""
print_info "Please have the following ready:"
echo "  • Supabase Project URL"
echo "  • Supabase Anon Key"
echo "  • Paystack Public Key"
echo ""

read -p "Do you have these credentials ready? (y/n): " READY

if [ "$READY" != "y" ]; then
    print_warning "Please gather your credentials first!"
    echo ""
    echo "Get them from:"
    echo "  Supabase: https://supabase.com/dashboard/project/_/settings/api"
    echo "  Paystack: https://dashboard.paystack.com/#/settings/developers"
    echo ""
    exit 1
fi

echo ""

# Collect Supabase credentials
read -p "Enter your Supabase Project URL: " SUPABASE_URL
read -p "Enter your Supabase Anon Key: " SUPABASE_KEY

# Collect Paystack credentials
read -p "Enter your Paystack Public Key (pk_test_ or pk_live_): " PAYSTACK_KEY

echo ""

# ============================================
# STEP 3: UPDATE CONFIGURATION FILES
# ============================================

echo "Step 3: Updating configuration files..."
echo ""

# Update supabase-config.js
if [ -f "supabase-config.js" ]; then
    # Create backup
    cp supabase-config.js supabase-config.js.backup
    
    # Update values
    sed -i.tmp "s|const SUPABASE_URL = '.*';|const SUPABASE_URL = '$SUPABASE_URL';|g" supabase-config.js
    sed -i.tmp "s|const SUPABASE_ANON_KEY = '.*';|const SUPABASE_ANON_KEY = '$SUPABASE_KEY';|g" supabase-config.js
    
    # Remove temp file
    rm -f supabase-config.js.tmp
    
    print_success "Updated supabase-config.js"
else
    print_error "supabase-config.js not found!"
fi

# Update paystack-config.js
if [ -f "paystack-config.js" ]; then
    # Create backup
    cp paystack-config.js paystack-config.js.backup
    
    # Update values
    sed -i.tmp "s|publicKey: '.*'|publicKey: '$PAYSTACK_KEY'|g" paystack-config.js
    
    # Remove temp file
    rm -f paystack-config.js.tmp
    
    print_success "Updated paystack-config.js"
else
    print_error "paystack-config.js not found!"
fi

echo ""

# ============================================
# STEP 4: CREATE ENVIRONMENT FILE
# ============================================

echo "Step 4: Creating .env file..."
echo ""

cat > .env << EOF
# ShopUp Configuration
# Generated on $(date)

# Supabase
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_KEY

# Paystack
PAYSTACK_PUBLIC_KEY=$PAYSTACK_KEY

# Email (Resend)
# Add this after setting up Resend
RESEND_API_KEY=

# Deployment
ENVIRONMENT=development
EOF

print_success "Created .env file"

echo ""

# ============================================
# STEP 5: CREATE .gitignore
# ============================================

echo "Step 5: Creating .gitignore..."
echo ""

cat > .gitignore << EOF
# Environment variables
.env
.env.local
.env.production

# Backups
*.backup

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*

# Dependencies
node_modules/

# Build outputs
dist/
build/
EOF

print_success "Created .gitignore"

echo ""

# ============================================
# STEP 6: VERIFY SETUP
# ============================================

echo "Step 6: Verifying setup..."
echo ""

ERRORS=0

# Check if URLs look valid
if [[ $SUPABASE_URL == *"supabase.co"* ]]; then
    print_success "Supabase URL looks valid"
else
    print_error "Supabase URL may be incorrect"
    ((ERRORS++))
fi

if [[ $SUPABASE_KEY == "eyJ"* ]]; then
    print_success "Supabase key looks valid"
else
    print_error "Supabase key may be incorrect"
    ((ERRORS++))
fi

if [[ $PAYSTACK_KEY == "pk_"* ]]; then
    print_success "Paystack key looks valid"
else
    print_error "Paystack key may be incorrect"
    ((ERRORS++))
fi

echo ""

# ============================================
# STEP 7: NEXT STEPS
# ============================================

echo "===================="
echo "✨ SETUP COMPLETE! ✨"
echo "===================="
echo ""

if [ $ERRORS -eq 0 ]; then
    print_success "All configuration looks good!"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Run database schemas in Supabase:"
    echo "   • 01_CUSTOMER_AUTH_SCHEMA.sql"
    echo "   • 02_PAYSTACK_SCHEMA.sql"
    echo "   • 03_EMAIL_NOTIFICATIONS_SCHEMA.sql"
    echo "   • 04_ADMIN_PANEL_SCHEMA.sql"
    echo ""
    echo "2. Create your first admin user:"
    echo "   • Go to Supabase Dashboard > Authentication > Users"
    echo "   • Add user manually"
    echo "   • Run SQL to assign admin role"
    echo ""
    echo "3. Deploy to hosting:"
    echo "   • Netlify: netlify deploy"
    echo "   • Vercel: vercel deploy"
    echo "   • GitHub Pages: git push"
    echo ""
    echo "4. Test your setup:"
    echo "   • Open index.html in browser"
    echo "   • Try registering a customer"
    echo "   • Test the login flow"
    echo ""
    echo "📖 Read DEPLOYMENT_GUIDE.md for detailed instructions"
    echo ""
    print_success "Happy selling! 🚀"
else
    print_warning "$ERRORS configuration issue(s) detected"
    echo ""
    echo "Please verify your credentials and run this script again."
fi

echo ""
