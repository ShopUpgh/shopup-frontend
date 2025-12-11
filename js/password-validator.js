/**
 * ShopUp Ghana - Password Strength Validator
 * 
 * Implements strong password requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

const PasswordValidator = {
    // Password requirements
    requirements: {
        minLength: window.AppConfig?.security?.minPasswordLength || 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
    },

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with strength score and feedback
     */
    validate(password) {
        const result = {
            isValid: false,
            strength: 'weak', // weak, medium, strong, very-strong
            score: 0,
            feedback: [],
            requirements: {}
        };

        if (!password) {
            result.feedback.push('Password is required');
            return result;
        }

        // Check minimum length
        result.requirements.minLength = password.length >= this.requirements.minLength;
        if (!result.requirements.minLength) {
            result.feedback.push(`At least ${this.requirements.minLength} characters required`);
        } else {
            result.score += 25;
        }

        // Check for uppercase letter
        result.requirements.uppercase = /[A-Z]/.test(password);
        if (!result.requirements.uppercase) {
            result.feedback.push('Include at least one uppercase letter (A-Z)');
        } else {
            result.score += 20;
        }

        // Check for lowercase letter
        result.requirements.lowercase = /[a-z]/.test(password);
        if (!result.requirements.lowercase) {
            result.feedback.push('Include at least one lowercase letter (a-z)');
        } else {
            result.score += 20;
        }

        // Check for number
        result.requirements.number = /[0-9]/.test(password);
        if (!result.requirements.number) {
            result.feedback.push('Include at least one number (0-9)');
        } else {
            result.score += 20;
        }

        // Check for special character
        result.requirements.special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        if (!result.requirements.special) {
            result.feedback.push('Include at least one special character (!@#$%^&* etc.)');
        } else {
            result.score += 15;
        }

        // Check for common patterns (bonus points for avoiding them)
        if (!this.hasCommonPatterns(password)) {
            result.score += 10;
        } else {
            result.feedback.push('Avoid common patterns like "123", "abc", "password"');
            result.score -= 10;
        }

        // Check for repeated characters
        if (!this.hasRepeatedCharacters(password)) {
            result.score += 10;
        } else {
            result.feedback.push('Avoid repeated characters (e.g., "aaa", "111")');
        }

        // Determine strength level
        if (result.score >= 90) {
            result.strength = 'very-strong';
        } else if (result.score >= 70) {
            result.strength = 'strong';
        } else if (result.score >= 50) {
            result.strength = 'medium';
        } else {
            result.strength = 'weak';
        }

        // Check if all requirements are met
        result.isValid = Object.values(result.requirements).every(req => req === true);

        if (result.isValid && result.feedback.length === 0) {
            result.feedback.push(`Password strength: ${result.strength}`);
        }

        return result;
    },

    /**
     * Check for common password patterns
     */
    hasCommonPatterns(password) {
        const commonPatterns = [
            /123/,
            /abc/i,
            /password/i,
            /qwerty/i,
            /admin/i,
            /letmein/i,
            /welcome/i,
            /monkey/i,
            /dragon/i,
            /master/i
        ];

        return commonPatterns.some(pattern => pattern.test(password));
    },

    /**
     * Check for repeated characters
     */
    hasRepeatedCharacters(password) {
        return /(.)\1{2,}/.test(password);
    },

    /**
     * Generate strength indicator HTML
     */
    getStrengthIndicatorHTML(strength) {
        const colors = {
            'weak': '#dc2626',
            'medium': '#f59e0b',
            'strong': '#10b981',
            'very-strong': '#059669'
        };

        const widths = {
            'weak': '25%',
            'medium': '50%',
            'strong': '75%',
            'very-strong': '100%'
        };

        return `
            <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; margin: 8px 0;">
                <div style="width: ${widths[strength]}; height: 100%; background: ${colors[strength]}; border-radius: 3px; transition: all 0.3s;"></div>
            </div>
            <div style="font-size: 12px; color: ${colors[strength]}; margin-top: 4px;">
                Password strength: ${strength.replace('-', ' ')}
            </div>
        `;
    },

    /**
     * Get strength color
     */
    getStrengthColor(strength) {
        const colors = {
            'weak': '#dc2626',
            'medium': '#f59e0b',
            'strong': '#10b981',
            'very-strong': '#059669'
        };
        return colors[strength] || '#6b7280';
    },

    /**
     * Attach real-time validator to password input
     */
    attachToInput(inputElement, feedbackElement) {
        if (!inputElement) {
            console.error('Password input element not found');
            return;
        }

        inputElement.addEventListener('input', (e) => {
            const password = e.target.value;
            const validation = this.validate(password);

            if (feedbackElement) {
                this.updateFeedbackElement(feedbackElement, validation);
            }

            // Add validity state to input
            if (password.length > 0) {
                if (validation.isValid) {
                    inputElement.classList.remove('invalid');
                    inputElement.classList.add('valid');
                } else {
                    inputElement.classList.remove('valid');
                    inputElement.classList.add('invalid');
                }
            } else {
                inputElement.classList.remove('valid', 'invalid');
            }
        });
    },

    /**
     * Update feedback element with validation results
     */
    updateFeedbackElement(element, validation) {
        if (!element) return;

        let html = '';

        // Strength indicator
        html += this.getStrengthIndicatorHTML(validation.strength);

        // Requirements checklist
        html += '<ul style="font-size: 13px; margin: 12px 0; padding-left: 20px; list-style: none;">';
        
        const requirementLabels = {
            minLength: `At least ${this.requirements.minLength} characters`,
            uppercase: 'One uppercase letter (A-Z)',
            lowercase: 'One lowercase letter (a-z)',
            number: 'One number (0-9)',
            special: 'One special character (!@#$%^&*)'
        };

        for (const [key, label] of Object.entries(requirementLabels)) {
            const met = validation.requirements[key];
            const icon = met ? '✓' : '○';
            const color = met ? '#10b981' : '#6b7280';
            html += `<li style="color: ${color}; margin: 4px 0;">${icon} ${label}</li>`;
        }

        html += '</ul>';

        // Additional feedback
        if (validation.feedback.length > 0 && !validation.isValid) {
            const tips = validation.feedback.filter(f => !f.startsWith('Password strength'));
            if (tips.length > 0) {
                html += '<div style="font-size: 12px; color: #dc2626; margin-top: 8px;">';
                html += '<strong>Tips:</strong><br>' + tips.join('<br>');
                html += '</div>';
            }
        }

        element.innerHTML = html;
    }
};

// Make available globally
window.PasswordValidator = PasswordValidator;

console.log('✅ PasswordValidator loaded');
