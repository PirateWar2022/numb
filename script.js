const consoleEl = document.getElementById('console');
const resultEl = document.getElementById('result');
let mode = 'rad'; // 'rad' or 'deg'

function sinDeg(x) { return Math.sin(x * Math.PI / 180); }
function cosDeg(x) { return Math.cos(x * Math.PI / 180); }
function tanDeg(x) { return Math.tan(x * Math.PI / 180); }
function asinDeg(x) { return Math.asin(x) * 180 / Math.PI; }
function acosDeg(x) { return Math.acos(x) * 180 / Math.PI; }
function atanDeg(x) { return Math.atan(x) * 180 / Math.PI; }

function preprocess(expr) {
    if (mode === 'deg') {
        expr = expr.replace(/sin\(/g, 'sinDeg(');
        expr = expr.replace(/cos\(/g, 'cosDeg(');
        expr = expr.replace(/tan\(/g, 'tanDeg(');
        expr = expr.replace(/asin\(/g, 'asinDeg(');
        expr = expr.replace(/acos\(/g, 'acosDeg(');
        expr = expr.replace(/atan\(/g, 'atanDeg(');
    }
    return expr;
}

function solve(equation, variable) {
    let expr = equation;
    
    // Handle equations with equals sign: convert left = right to left - right
    if (expr.includes('=')) {
        const parts = expr.split('=');
        if (parts.length === 2) {
            expr = `(${parts[0]}) - (${parts[1]})`;
        } else {
            return 'Error: Invalid equation format';
        }
    }
    
    expr = expr.replace(new RegExp(variable, 'g'), '({VAR})');
    
    try {
        const f = (x) => {
            try {
                return eval(expr.replace(/{VAR}/g, x));
            } catch (e) {
                return NaN;
            }
        };
        
        let roots = [];
        
        for (let start = -1000; start < 1000; start += 100) {
            const f1 = f(start);
            const f2 = f(start + 100);
            
            if (!isNaN(f1) && !isNaN(f2) && f1 * f2 < 0) {
                let low = start;
                let high = start + 100;
                for (let i = 0; i < 50; i++) {
                    const mid = (low + high) / 2;
                    const fmid = f(mid);
                    if (Math.abs(fmid) < 1e-6) break;
                    if (fmid * f1 < 0) high = mid;
                    else low = mid;
                }
                const root = (low + high) / 2;
                const roundedRoot = Math.round(root * 1e10) / 1e10;
                if (!roots.some(r => Math.abs(r - roundedRoot) < 1e-6)) {
                    roots.push(roundedRoot);
                }
            }
        }
        
        return roots.length > 0 ? `${variable} = ${roots.join(', ')}` : 'No roots found';
    } catch (error) {
        return `Error: ${error.message}`;
    }
}
consoleEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const lines = consoleEl.value.split('\n');
        const lastLine = lines.pop().trim();
        if (lastLine) {
            if (lastLine.toLowerCase() === 'clear') {
                consoleEl.value = '';
                resultEl.innerHTML = '';
            } else if (lastLine.toLowerCase() === 'mode rad') {
                mode = 'rad';
                consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + 'Mode set to radians\n';
            } else if (lastLine.toLowerCase() === 'mode deg') {
                mode = 'deg';
                consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + 'Mode set to degrees\n';
            } else if (lastLine.toLowerCase().includes('solve(')) {
                const match = lastLine.match(/solve\((.+),\s*([a-zA-Z_]\w*)\)/);
                if (match) {
                    const equation = match[1];
                    const variable = match[2];
                    try {
                        const result = solve(equation, variable);
                        consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                        resultEl.innerHTML += '<li>' + result + '</li>';
                    } catch (error) {
                        consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + ' = Error: ' + error.message + '\n';
                        resultEl.innerHTML += '<li>Error: ' + error.message + '</li>';
                    }
                } else {
                    consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + ' = Error: Use solve(equation, variable)\n';
                    resultEl.innerHTML += '<li>Error: Use solve(equation, variable)</li>';
                }
            } else {
                try {
                    const processed = preprocess(lastLine);
                    const result = eval(processed);
                    consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                    resultEl.innerHTML += '<li>' + result + '</li>';
                } catch (error) {
                    consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + ' = Error: ' + error.message + '\n';
                    resultEl.innerHTML += '<li>Error: ' + error.message + '</li>';
                }
            }
        }
    }
});