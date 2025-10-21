// Calculator Functions
let currentInput = '';
let operator = '';
let previousInput = '';
let justCalculated = false; // Flag to track if we just calculated a result

function appendToDisplay(value) {
    const display = document.getElementById('display');
    
    if (value === '%') {
        // Handle percentage
        if (currentInput !== '') {
            currentInput = (parseFloat(currentInput) / 100).toString();
            display.textContent = currentInput;
        }
        return;
    }
    
    // Handle operators
    if (['+', '-', '*', '/'].includes(value)) {
        if (currentInput !== '') {
            if (previousInput !== '' && operator !== '') {
                calculate();
            }
            previousInput = currentInput;
            operator = value;
            currentInput = '';
            justCalculated = false; // Reset flag when operator is pressed
            display.textContent = previousInput + ' ' + value + ' ';
        }
        return;
    }
    
    // Handle numbers and decimal point
    
    // Auto clear after calculation when entering new number
    if (justCalculated) {
        currentInput = '';
        previousInput = '';
        operator = '';
        justCalculated = false;
    }
    
    currentInput += value;
    if (operator !== '') {
        display.textContent = previousInput + ' ' + operator + ' ' + currentInput;
    } else {
        display.textContent = currentInput;
    }
}

function calculate() {
    const display = document.getElementById('display');
    
    if (previousInput !== '' && currentInput !== '' && operator !== '') {
        let result;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        
        switch (operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current !== 0) {
                    result = prev / current;
                } else {
                    display.textContent = 'Error';
                    return;
                }
                break;
            default:
                return;
        }
        
        // Format result
        result = Math.round(result * 100000000) / 100000000; // Avoid floating point errors
        display.textContent = result;
        
        // Reset for next calculation
        currentInput = result.toString();
        previousInput = '';
        operator = '';
        justCalculated = true; // Set flag that we just calculated
    }
}

function clearDisplay() {
    const display = document.getElementById('display');
    currentInput = '';
    previousInput = '';
    operator = '';
    justCalculated = false; // Reset flag when clearing
    display.textContent = '0';
}

function applyNegativeToLastNumber() {
    const display = document.getElementById('display');
    
    if (currentInput !== '') {
        currentInput = (parseFloat(currentInput) * -1).toString();
        if (operator !== '') {
            display.textContent = previousInput + ' ' + operator + ' ' + currentInput;
        } else {
            display.textContent = currentInput;
        }
    }
}

// Initialize display
document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('display');
    if (display) {
        display.textContent = '0';
    }
});