let displayExpression = '';
let justCalculated = false;

function appendToDisplay(value) {
    const display = document.getElementById('display');

    // If previous calculation was done, clear for new input
    if (justCalculated && !isOperator(value) && value !== ')') {
        displayExpression = '';
        justCalculated = false;
    }

    // Handle scientific functions
    const funcs = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'exp'];
    if (funcs.includes(value)) {
        if (displayExpression !== '' && !displayExpression.endsWith('(') && !displayExpression.endsWith(' ') 
            && !isOperator(displayExpression[displayExpression.length - 1])) {
            displayExpression += '*';
        }
        displayExpression += value + '(';
        display.textContent = displayExpression;
        return;
    }

    // Handle operators
    if (isOperator(value)) {
        if (displayExpression === '') return;
        if (isOperator(displayExpression[displayExpression.length - 1])) {
            displayExpression = displayExpression.slice(0, -1);
        }
        displayExpression += ' ' + value + ' ';
        display.textContent = displayExpression;
        return;
    }

    // Handle parentheses
    if (value === '(' || value === ')') {
        if (value === '(') {
            // Add multiplication ONLY if:
            // 1. There is a previous character AND
            // 2. The last character is a number or closing parenthesis AND
            // 3. We're not after a function name AND
            // 4. We're not after an operator
            if (displayExpression !== '') {
                let lastChar = displayExpression[displayExpression.length - 1];
                let endsWithFunc = funcs.some(func => displayExpression.endsWith(func));
                let endsWithOperator = isOperator(lastChar) || displayExpression.endsWith(' ');
                
                if (!endsWithFunc && !endsWithOperator && (!isNaN(lastChar) || lastChar === ')')) {
                    displayExpression += '*';
                }
            }
        }
        if (value === ')') {
            // Only add closing parenthesis if there's an unclosed one
            let openCount = (displayExpression.match(/\(/g) || []).length;
            let closeCount = (displayExpression.match(/\)/g) || []).length;
            if (openCount <= closeCount) return;
        }
        displayExpression += value;
        display.textContent = displayExpression;
        return;
    }

    // Handle clear
    if (value === 'C') {
        clearDisplay();
        return;
    }

    // Handle percentage
    if (value === '%') {
        if (displayExpression !== '') {
            // Find the last number in the expression, considering spaces and operators
            let parts = displayExpression.split(/([+\-*/()^\s])/).filter(Boolean);
            let lastNum = parts[parts.length - 1];
            if (!isNaN(lastNum)) {
                let result = parseFloat(lastNum) / 100;
                displayExpression = displayExpression.slice(0, -(lastNum.length)) + result.toString();
                display.textContent = displayExpression;
            }
        }
        return;
    }

    // Handle negative/positive toggle
    if (value === '+/-') {
        if (displayExpression === '') {
            displayExpression = '-';
            display.textContent = displayExpression;
            return;
        }
        
        // Find the last number in the expression
        let parts = displayExpression.split(/([+\-*/()^\s])/).filter(Boolean);
        let lastNum = parts[parts.length - 1];
        
        if (!isNaN(lastNum)) {
            // If we found a number, toggle its sign
            let result = parseFloat(lastNum) * -1;
            displayExpression = displayExpression.slice(0, -(lastNum.length)) + result.toString();
        } else if (displayExpression.endsWith('(') || displayExpression.endsWith(' ')) {
            // If after opening parenthesis or operator, add negative sign
            displayExpression += '-';
        }
        
        display.textContent = displayExpression;
        return;
    }

    // Handle degree symbol for trigonometric functions
    if (value === '°') {
        if (displayExpression !== '') {
            let hasTrigFunction = /(sin|cos|tan)\([^)]*$/.test(displayExpression);
            if (hasTrigFunction && !displayExpression.endsWith('°')) {
                displayExpression += '°';
                display.textContent = displayExpression;
            }
        }
        return;
    }

    // Handle numbers and decimal point
    if (value === '.') {
        // Prevent multiple decimals in a number
        let parts = displayExpression.split(/[\s()*/+-]/).filter(Boolean);
        let lastNumber = parts[parts.length - 1];
        if (lastNumber && lastNumber.includes('.')) return;
    }

    displayExpression += value;
    display.textContent = displayExpression;


}

function calculate() {
    if (displayExpression === '') return;

    try {
        // Add any missing closing parentheses
        let openCount = (displayExpression.match(/\(/g) || []).length;
        let closeCount = (displayExpression.match(/\)/g) || []).length;
        if (openCount > closeCount) {
            displayExpression += ')'.repeat(openCount - closeCount);
            document.getElementById('display').textContent = displayExpression;
        }

        // Replace scientific function names with Math equivalents
        let expression = displayExpression
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/exp/g, 'Math.exp')
            .replace(/\^/g, '**');

        // Handle degree symbol and convert to radians for trig functions
        let matches = expression.match(/Math\.(sin|cos|tan)\((.*?)\)/g);
        if (matches) {
            matches.forEach(match => {
                try {
                    let inner = match.match(/\((.*?)\)/)[1];
                    // Remove degree symbol if present
                    let value = inner.replace('°', '');
                    // Always convert to radians since we're dealing with trig functions
                    expression = expression.replace(
                        match, 
                        `Math.${match.match(/Math\.(\w+)/)[1]}((${value}) * Math.PI / 180)`
                    );
                } catch (e) {
                    // If parsing fails, leave as is
                }
            });
        }

        // Evaluate the expression
        let result = Function('return ' + expression)();

        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Error');
        }

        // Round and format the result
        result = Math.round(result * 1e10) / 1e10;
        if (Math.abs(result) < 1e-10 && result !== 0) {
            result = result.toExponential(6);
        }

        const display = document.getElementById('display');
        display.textContent = result;
        displayExpression = result.toString();
        saveToHistory(expression, result);
        justCalculated = true;
    } catch (err) {
        const display = document.getElementById('display');
        display.textContent = 'Error';
        displayExpression = '';
        justCalculated = true;
    }
}

function clearDisplay() {
    displayExpression = '';
    justCalculated = false;
    document.getElementById('display').textContent = '0';
}

function isOperator(char) {
    return ['+', '-', '*', '/', '^', '%'].includes(char);
}

// Initialize display when page loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('display').textContent = '0';
});

async function saveToHistory(expression, result) {
  try {
    // Ambil user langsung dari localStorage
    const userData = localStorage.getItem('user');
    let userId = null;

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        userId = parsedUser.id; // pastikan sesuai dengan field id di tabel users kamu
      } catch (e) {
        console.error('❌ Gagal parse user dari localStorage:', e);
      }
    }

    // Kalau belum login, jangan kirim ke database
    if (!userId) {
      console.warn('⚠️ User belum login, history tidak disimpan');
      return;
    }

    console.log('📤 Kirim data ke backend:', { user_id: userId, expression, result });

    const response = await fetch('/api/calculator/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        expression,
        result
      })
    });

    const data = await response.json();
    console.log('📥 Respon server:', response.status, data);

    if (!response.ok) {
      console.error('❌ Gagal menyimpan history:', data.error);
    } else {
      console.log('✅ History berhasil disimpan');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}
