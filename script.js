// --- State Management for Step Building ---
let pq = [];
let treeBuilt = false;

// --- Huffman Algorithm Logic ---
class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
        this.id = Math.random().toString(36).substr(2, 9); // For D3 keys
    }
}

function buildFrequencyMap(text) {
    const freqMap = {};
    for (const char of text) {
        freqMap[char] = (freqMap[char] || 0) + 1;
    }
    return freqMap;
}

function initPQ(freqMap) {
    pq = Object.entries(freqMap).map(([char, freq]) => new Node(char, freq));
    pq.sort((a, b) => a.freq - b.freq);
    treeBuilt = false;
}

function buildHuffmanTree(freqMap) {
    initPQ(freqMap);
    while (pq.length > 1) {
        stepMerge();
    }
    treeBuilt = true;
    return pq[0];
}

function stepMerge() {
    if (pq.length < 2) {
        treeBuilt = true;
        return pq[0];
    }
    pq.sort((a, b) => a.freq - b.freq);

    const left = pq.shift();
    const right = pq.shift();

    const internalNode = new Node(null, left.freq + right.freq, left, right);
    pq.push(internalNode);
    return internalNode;
}

function generateCodes(node, prefix = "", codeMap = {}) {
    if (!node) return codeMap;

    if (node.char !== null) {
        codeMap[node.char] = prefix || "0"; // Handle single character case
    } else {
        generateCodes(node.left, prefix + "0", codeMap);
        generateCodes(node.right, prefix + "1", codeMap);
    }

    return codeMap;
}

// --- UI Logic ---
const inputArea = document.getElementById('input-text');
const compressBtn = document.getElementById('compress-btn');
const stepBtn = document.getElementById('step-btn');
const importFile = document.getElementById('import-file');
const exportBtn = document.getElementById('export-btn');

const totalCharsEl = document.getElementById('total-chars');
const uniqueCharsEl = document.getElementById('unique-chars');
const origSizeEl = document.getElementById('orig-size');
const compSizeEl = document.getElementById('comp-size');
const ratioEl = document.getElementById('ratio');
const savingsEl = document.getElementById('savings');
const progressBar = document.getElementById('comp-progress');
const freqTableBody = document.querySelector('#freq-table tbody');
const codeTableBody = document.querySelector('#code-table tbody');
const outputBox = document.getElementById('output-text');
const copyBtn = document.getElementById('copy-btn');

let currentRoot = null;
let currentCodeMap = {};

function runFullCompression() {
    const text = inputArea.value;
    if (!text) return alert("Please enter some text!");

    const freqMap = buildFrequencyMap(text);
    initPQ(freqMap);
    currentRoot = buildHuffmanTree(freqMap);
    currentCodeMap = generateCodes(currentRoot);

    updateUI(text, freqMap, currentCodeMap);
    visualizeTree(currentRoot);
}

compressBtn.addEventListener('click', runFullCompression);

stepBtn.addEventListener('click', () => {
    const text = inputArea.value;
    if (!text) return alert("Please enter some text!");

    if (!pq.length || treeBuilt) {
        const freqMap = buildFrequencyMap(text);
        initPQ(freqMap);
        updateFreqTable(freqMap, text.length);
        outputBox.innerHTML = "Building tree step-by-step...";
        visualizePQ(pq);
        return;
    }

    if (pq.length > 1) {
        stepMerge();
        visualizePQ(pq);
        if (pq.length === 1) {
            treeBuilt = true;
            currentRoot = pq[0];
            currentCodeMap = generateCodes(currentRoot);
            updateUI(text, buildFrequencyMap(text), currentCodeMap);
            visualizeTree(currentRoot);
        }
    }
});

function updateUI(text, freqMap, codeMap) {
    totalCharsEl.textContent = text.length;
    uniqueCharsEl.textContent = Object.keys(freqMap).length;

    updateFreqTable(freqMap, text.length);
    updateCodeTable(codeMap);
    updateStats(text, codeMap);
    updateEncodedOutput(text, codeMap);
}

// File Import
importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        inputArea.value = e.target.result;
        runFullCompression();
    };
    reader.readAsText(file);
});

// File Export
exportBtn.addEventListener('click', () => {
    const blob = new Blob([outputBox.innerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compressed_output.bin';
    a.click();
});

function updateFreqTable(freqMap, total) {
    freqTableBody.innerHTML = "";
    const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([char, freq]) => {
        const row = document.createElement('tr');
        const displayChar = char === " " ? "␣ (space)" : (char === "\n" ? "↵ (newline)" : char);
        const weight = ((freq / total) * 100).toFixed(1) + "%";

        row.innerHTML = `
            <td>${displayChar}</td>
            <td>${freq}</td>
            <td>${weight}</td>
        `;
        freqTableBody.appendChild(row);
    });
}

function updateCodeTable(codeMap) {
    codeTableBody.innerHTML = "";
    const sorted = Object.entries(codeMap).sort((a, b) => a[1].length - b[1].length);

    sorted.forEach(([char, code]) => {
        const row = document.createElement('tr');
        row.dataset.char = char;
        const displayChar = char === " " ? "␣" : (char === "\n" ? "↵" : char);
        const colorClass = code.length <= 4 ? "var(--success)" : "var(--danger)";

        row.innerHTML = `
            <td>${displayChar}</td>
            <td><span class="code-pill" style="color: ${colorClass}">${code}</span></td>
            <td>${code.length}</td>
        `;

        // Highlight occurrences on hover
        row.onmouseenter = () => highlightChar(char);
        row.onmouseleave = () => resetHighlight();

        codeTableBody.appendChild(row);
    });
}

function updateStats(text, codeMap) {
    const origBits = text.length * 8;
    let compBits = 0;
    for (const char of text) {
        compBits += codeMap[char].length;
    }

    const ratio = (origBits / compBits).toFixed(2);
    const savings = Math.max(0, ((1 - compBits / origBits) * 100)).toFixed(1);

    origSizeEl.textContent = origBits;
    compSizeEl.textContent = compBits;
    ratioEl.textContent = ratio;
    savingsEl.textContent = savings;

    progressBar.style.width = savings + "%";
}

function updateEncodedOutput(text, codeMap) {
    outputBox.innerHTML = "";
    for (const char of text) {
        const span = document.createElement('span');
        span.className = 'encoded-bit';
        span.dataset.char = char;
        span.textContent = codeMap[char];
        outputBox.appendChild(span);
    }
}

function highlightChar(char) {
    document.querySelectorAll(`.encoded-bit[data-char="${CSS.escape(char)}"]`).forEach(el => {
        el.classList.add('highlight-active');
    });
}

function resetHighlight() {
    document.querySelectorAll('.highlight-active').forEach(el => {
        el.classList.remove('highlight-active');
    });
}

copyBtn.addEventListener('click', () => {
    const text = outputBox.innerText;
    if (text === "Binary output will appear here...") return;

    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = " Copied!";
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });
});

function visualizeTree(root) {
    const svg = d3.select("#tree-svg");
    svg.selectAll("*").remove();

    const container = document.getElementById('tree-svg');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 40, right: 90, bottom: 40, left: 90 };

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const d3Root = d3.hierarchy(root, d => d.left || d.right ? [d.left, d.right].filter(n => n) : null);
    const treeLayout = d3.tree().size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
    treeLayout(d3Root);

    const links = g.selectAll(".link")
        .data(d3Root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .style("opacity", 0)
        .transition().duration(800).style("opacity", 1);

    const nodes = g.selectAll(".node")
        .data(d3Root.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("circle")
        .attr("r", 0)
        .style("fill", d => d.data.char !== null ? "var(--accent-secondary)" : "var(--card-bg)")
        .style("stroke", d => d.data.char !== null ? "var(--accent-secondary)" : "var(--accent-primary)")
        .transition().duration(500).delay((d, i) => i * 50).attr("r", 18);

    nodes.append("text")
        .attr("dy", ".35em")
        .style("fill-opacity", 0)
        .text(d => d.data.char !== null
            ? (d.data.char === " " ? "␣" : (d.data.char === "\n" ? "↵" : d.data.char))
            : d.data.freq)
        .transition().duration(500).delay((d, i) => i * 50 + 200).style("fill-opacity", 1);

    g.selectAll(".link-label")
        .data(d3Root.links())
        .enter().append("text")
        .attr("class", "link-label")
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2)
        .attr("text-anchor", "middle")
        .style("fill", "var(--text-dim)")
        .style("font-size", "10px")
        .text(d => d.source.children[0] === d.target ? "0" : "1")
        .style("opacity", 0)
        .transition().duration(800).delay(500).style("opacity", 1);
}

function visualizePQ(nodesList) {
    const svg = d3.select("#tree-svg");
    svg.selectAll("*").remove();

    const width = document.getElementById('tree-svg').clientWidth;
    const height = document.getElementById('tree-svg').clientHeight;

    const spacing = Math.min(width / (nodesList.length + 1), 100);
    const startX = (width - (nodesList.length - 1) * spacing) / 2;

    const g = svg.append("g").attr("transform", `translate(0, ${height / 2})`);

    const nodeG = g.selectAll(".pq-node")
        .data(nodesList, d => d.id)
        .enter().append("g")
        .attr("class", "pq-node")
        .attr("transform", (d, i) => `translate(${startX + i * spacing}, 0)`);

    nodeG.append("circle")
        .attr("r", 20)
        .style("fill", "var(--card-bg)")
        .style("stroke", "var(--accent-primary)")
        .style("stroke-width", "2px");

    nodeG.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .text(d => d.char !== null ? (d.char === " " ? "␣" : d.char) : d.freq);
}
