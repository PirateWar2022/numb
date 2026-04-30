const consoleEl = document.getElementById('console');
const resultEl = document.getElementById('result');
const suggestionsEl = document.getElementById('suggestions');
let mode = 'rad'; // 'rad' or 'deg'

function add(a, b) { return a + b; }
function sub(a, b) { return a - b; }
function mul(a, b) { return a * b; }
function div(a, b) { return b === 0 ? 'Infinity' : a / b; }
function pow(a, b) { return Math.pow(a, b); }
function sqrt(x) { return Math.sqrt(x); }
function abs(x) { return Math.abs(x); }
function max(a, b) { return Math.max(a, b); }
function min(a, b) { return Math.min(a, b); }
function log(x) { return Math.log(x); }
function log10(x) { return Math.log10(x); }
function exp(x) { return Math.exp(x); }

function sinDeg(x) { return Math.sin(x * Math.PI / 180); }
function cosDeg(x) { return Math.cos(x * Math.PI / 180); }
function tanDeg(x) { return Math.tan(x * Math.PI / 180); }
function asinDeg(x) { return Math.asin(x) * 180 / Math.PI; }
function acosDeg(x) { return Math.acos(x) * 180 / Math.PI; }
function atanDeg(x) { return Math.atan(x) * 180 / Math.PI; }

function availableFunctions() {
    return [
        'add(a, b)', 'sub(a, b)', 'mul(a, b)', 'div(a, b)',
        'pow(a, b)', 'sqrt(x)', 'abs(x)',
        'max(a, b)', 'min(a, b)', 'log(x)', 'log10(x)', 'exp(x)',
        'sin(x)', 'cos(x)', 'tan(x)',
        'sin(45)', 'cos(30)', 'tan(60)',
        'expand(expr)', 'solve(equation, variable)',
        'help', 'functions', 'mode rad', 'mode deg', 'clear'
    ];
}

function helpText() {
    return [
        'Basic calculator commands:',
        '  - Type math expressions directly: 2+2, 3*5, sqrt(9)',
        '  - add(a, b), sub(a, b), mul(a, b), div(a, b)',
        '  - pow(a, b), sqrt(x), abs(x), max(a,b), min(a,b)',
        '  - sin(x), cos(x), tan(x) in radians by default',
        '  - Use "mode deg" to switch to degrees',
        '  - Use "mode rad" to switch back to radians',
        '  - expand((x+2)(x+3)) to expand algebraic expressions',
        '  - Type "functions" to see the function list',
        '  - Type "help" to show this message',
        '  - Type "clear" to clear the console',
        '  - Type "solve(equation, variable)" to solve equations'
    ];
}

function appendResult(message) {
    const item = document.createElement('li');
    item.textContent = message;
    resultEl.appendChild(item);
}

function getCurrentToken() {
    const position = consoleEl.selectionStart;
    const text = consoleEl.value.slice(0, position);
    const match = text.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    return match ? match[1] : '';
}

function showSuggestions(token) {
    const lowerToken = token.toLowerCase();
    const matches = availableFunctions().filter(fn => fn.toLowerCase().startsWith(lowerToken));
    if (!matches.length) {
        suggestionsEl.style.display = 'none';
        suggestionsEl.innerHTML = '';
        return;
    }
    suggestionsEl.innerHTML = matches.map(fn => `
        <button type="button" class="suggestion-item" data-suggestion="${fn}">${fn}</button>
    `).join('');
    suggestionsEl.style.display = 'flex';
}

function clearSuggestions() {
    suggestionsEl.style.display = 'none';
    suggestionsEl.innerHTML = '';
}

consoleEl.addEventListener('input', function () {
    const token = getCurrentToken();
    if (token) showSuggestions(token);
    else clearSuggestions();
});

consoleEl.addEventListener('click', function () {
    const token = getCurrentToken();
    if (token) showSuggestions(token);
});

suggestionsEl.addEventListener('click', function (event) {
    const button = event.target.closest('.suggestion-item');
    if (!button) return;
    const suggestion = button.dataset.suggestion;
    const cursorPos = consoleEl.selectionStart;
    const before = consoleEl.value.slice(0, cursorPos).replace(/([A-Za-z_][A-Za-z0-9_]*)$/, '');
    const after = consoleEl.value.slice(cursorPos);
    const insertText = suggestion.includes('(') ? suggestion.replace(/\(.*/, '(') : suggestion;
    consoleEl.value = before + insertText + after;
    const newPos = before.length + insertText.length;
    consoleEl.setSelectionRange(newPos, newPos);
    consoleEl.focus();
    clearSuggestions();
});

document.addEventListener('click', function (event) {
    if (!suggestionsEl.contains(event.target) && event.target !== consoleEl) {
        clearSuggestions();
    }
});

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

// ── expand() ────────────────────────────────────────────────────────────────

function expand(expr) {
    // Normalise: remove spaces, convert ** to ^, remove * between adjacent factors
    let s = expr
        .replace(/\s+/g, '')
        .replace(/\*\*/g, '^')
        .replace(/\)\s*\*\s*\(/g, ')(');  // (a)*(b) → (a)(b)

    const steps = [];
    steps.push({ label: 'Input normalised', val: s });

    s = expandPowers(s, steps);

    const factors = parseFactors(s);
    steps.push({
        label: `Found ${factors.length} factor(s)`,
        val: factors.map(f => '(' + formatPoly(f) + ')').join('')
    });

    let result = factors[0];
    for (let i = 1; i < factors.length; i++) {
        result = multiplyPolys(result, factors[i]);
        steps.push({ label: `After multiplying factor ${i + 1}`, val: formatPoly(result) });
    }

    const final = formatPoly(result);
    return { result: final, steps };
}

function expandPowers(s, steps) {
    const re = /\(([^()]+)\)\^(\d+)/g;
    return s.replace(re, (_, inner, n) => {
        const rep = `(${inner})`.repeat(Number(n));
        if (steps) steps.push({ label: `(${inner})^${n} → repeated ${n}×`, val: rep });
        return rep;
    });
}

function parseFactors(s) {
    const factors = [];
    let depth = 0, start = -1;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') { if (!depth++) start = i + 1; }
        else if (s[i] === ')') { if (!--depth) factors.push(parsePoly(s.slice(start, i))); }
    }
    if (!factors.length) factors.push(parsePoly(s));
    return factors;
}

function parsePoly(s) {
    // Split on + or - but keep the sign attached to each token
    // e.g. "3x^2-2x+1" → ["3x^2", "-2x", "+1"]
    const tokens = s.match(/[+-]?([0-9]*\.?[0-9]*x(?:\^[0-9]+)?|[0-9]+\.?[0-9]*x?)/g) || [];
    const terms = [];
    for (const token of tokens) {
        const xIdx = token.indexOf('x');
        if (xIdx === -1) {
            // pure number
            const coef = Number(token);
            if (!isNaN(coef) && coef !== 0) terms.push({ coef, exp: 0 });
        } else {
            // has x
            const coefPart = token.slice(0, xIdx);
            const coef = coefPart === '' || coefPart === '+' ? 1
                       : coefPart === '-' ? -1
                       : Number(coefPart);
            const caretIdx = token.indexOf('^', xIdx);
            const exp = caretIdx === -1 ? 1 : Number(token.slice(caretIdx + 1));
            if (!isNaN(coef) && coef !== 0) terms.push({ coef, exp });
        }
    }
    return terms.length ? terms : [{ coef: 0, exp: 0 }];
}

function multiplyPolys(a, b) {
    const map = new Map();
    for (const ta of a) for (const tb of b) {
        const e = ta.exp + tb.exp;
        map.set(e, (map.get(e) || 0) + ta.coef * tb.coef);
    }
    return [...map.entries()]
        .filter(([, c]) => c !== 0)
        .sort(([a], [b]) => b - a)
        .map(([exp, coef]) => ({ coef, exp }));
}

// FIX: was writing to consoleEl and missing the return statement
function formatPoly(terms) {
    if (!terms.length) return '0';
    const sup = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');
    return terms.map(({ coef, exp }, i) => {
        const sign    = i === 0 ? (coef < 0 ? '-' : '') : (coef < 0 ? ' - ' : ' + ');
        const absC    = Math.abs(coef);
        const xPart   = exp === 0 ? '' : exp === 1 ? 'x' : `x${sup(exp)}`;
        const coefStr = (absC === 1 && exp > 0) ? '' : String(absC);
        return sign + coefStr + xPart;  // FIX: return the string, don't write to DOM
    }).join('');
}

// ── Keydown handler ──────────────────────────────────────────────────────────

consoleEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const lines = consoleEl.value.split('\n');
        const lastLine = lines.pop().trim();

        if (lastLine) {
            const lower = lastLine.toLowerCase().trim();

            if (lower === 'clear') {
                consoleEl.value = '';
                resultEl.innerHTML = '';

            } else if (lower === 'help' || lower === 'help()') {
                consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                helpText().forEach(line => appendResult(line));

            } else if (lower === 'functions' || lower === 'functions()') {
                consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                appendResult('Available functions: ' + availableFunctions().join(', '));

            } else if (lower === 'mode rad') {
                mode = 'rad';
                consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + 'Mode set to radians\n';

            } else if (lower === 'mode deg') {
                mode = 'deg';
                consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + 'Mode set to degrees\n';

            // FIX: expand branch must come BEFORE the eval fallback so it never hits eval()
            } else if (lower.startsWith('expand(')) {
                const match = lastLine.match(/^expand\((.+)\)$/i);
                if (match) {
                    try {
                        const { result, steps } = expand(match[1]);
                        consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                        resultEl.innerHTML += '<li>' + result + '</li>';
                    } catch (error) {
                        consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                        resultEl.innerHTML += '<li>Error: ' + error.message + '</li>';
                    }
                } else {
                    consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                    resultEl.innerHTML += '<li>Error: Use expand((x+2)(x+3))</li>';
                }

            } else if (lower.includes('solve(')) {
                const match = lastLine.match(/solve\((.+),\s*([a-zA-Z_]\w*)\)/);
                if (match) {
                    const equation = match[1];
                    const variable = match[2];
                    try {
                        const result = solve(equation, variable);
                        consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '') + lastLine + '\n';
                        resultEl.innerHTML += '<li>' + result + '</li>';
                    } catch (error) {
                        consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '');
                        resultEl.innerHTML += '<li>Error: ' + error.message + '</li>';
                    }
                } else {
                    consoleEl.value = lines.join('\n') + (lines.length ? '\n' : '');
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

            clearSuggestions();
        }
    }
});