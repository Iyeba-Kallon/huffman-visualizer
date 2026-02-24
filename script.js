// --- Huffman Algorithm Logic ---
class Node {
    constructor(char, freq, left = null, right = null) {
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

function buildFrequencyMap(text) {
    const freqMap = {};
    for (const char of text) {
        freqMap[char] = (freqMap[char] || 0) + 1;
    }
    return freqMap;
}

function buildHuffmanTree(freqMap) {
    const priorityQueue = Object.entries(freqMap).map(([char, freq]) => new Node(char, freq));

    // Simple sorting for priority queue (min-heap would be better for O(n log n), but for visualizer O(n^2) is fine and easier to animate later)
    while (priorityQueue.length > 1) {
        priorityQueue.sort((a, b) => a.freq - b.freq);

        const left = priorityQueue.shift();
        const right = priorityQueue.shift();

        const internalNode = new Node(null, left.freq + right.freq, left, right);
        priorityQueue.push(internalNode);
    }

    return priorityQueue[0];
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

compressBtn.addEventListener('click', () => {
    const text = inputArea.value;
    if (!text) return alert("Please enter some text!");

    // 1. Stats and Basic Logic
    const freqMap = buildFrequencyMap(text);
    const uniqueChars = Object.keys(freqMap).length;
    const totalChars = text.length;

    totalCharsEl.textContent = totalChars;
    uniqueCharsEl.textContent = uniqueChars;

    // 2. Build Tree and Codes
    const root = buildHuffmanTree(freqMap);
    const codeMap = generateCodes(root);

    // 3. Update Tables
    updateFreqTable(freqMap, totalChars);
    updateCodeTable(codeMap);

    // 4. Calculate Compression Stats
    updateStats(text, codeMap);

    // 5. Encoded Output
    let encodedString = "";
    for (const char of text) {
        encodedString += codeMap[char];
    }
    outputBox.textContent = encodedString;

    // 6. Tree Visualization
    visualizeTree(root);
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
        const displayChar = char === " " ? "␣" : (char === "\n" ? "↵" : char);
        const colorClass = code.length <= 4 ? "var(--success)" : "var(--danger)";

        row.innerHTML = `
        <td>${displayChar}</td>
        <td><span class="code-pill" style="color: ${colorClass}">${code}</span></td>
        <td>${code.length}</td>
    `;
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

copyBtn.addEventListener('click', () => {
    const text = outputBox.textContent;
    if (text === "Binary output will appear here...") return;

    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = " Copied!";
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    });
});

function visualizeTree(root) {
    const svg = d3.select("#tree-svg");
    svg.selectAll("*").remove(); // Clear previous tree

    const container = document.getElementById('tree-svg');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 40, right: 90, bottom: 40, left: 90 };

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Transform custom Node structure to D3 hierarchy
    const d3Root = d3.hierarchy(root, d => d.left || d.right ? [d.left, d.right].filter(n => n) : null);

    const treeLayout = d3.tree().size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
    treeLayout(d3Root);

    // Links
    const links = g.selectAll(".link")
        .data(d3Root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y))
        .style("opacity", 0)
        .transition()
        .duration(800)
        .style("opacity", 1);

    // Nodes
    const nodes = g.selectAll(".node")
        .data(d3Root.descendants())
        .enter().append("g")
        .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("circle")
        .attr("r", 0)
        .style("fill", d => d.data.char !== null ? "var(--accent-secondary)" : "var(--card-bg)")
        .style("stroke", d => d.data.char !== null ? "var(--accent-secondary)" : "var(--accent-primary)")
        .transition()
        .duration(500)
        .delay((d, i) => i * 50)
        .attr("r", 18);

    nodes.append("text")
        .attr("dy", ".35em")
        .style("fill-opacity", 0)
        .text(d => d.data.char !== null
            ? (d.data.char === " " ? "␣" : (d.data.char === "\n" ? "↵" : d.data.char))
            : d.data.freq)
        .transition()
        .duration(500)
        .delay((d, i) => i * 50 + 200)
        .style("fill-opacity", 1);

    // Add 0/1 labels to links
    g.selectAll(".link-label")
        .data(d3Root.links())
        .enter().append("text")
        .attr("class", "link-label")
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2)
        .attr("dy", -5)
        .attr("text-anchor", "middle")
        .style("fill", "var(--text-dim)")
        .style("font-size", "10px")
        .text((d, i) => d.source.children[0] === d.target ? "0" : "1")
        .style("opacity", 0)
        .transition()
        .duration(800)
        .delay(500)
        .style("opacity", 1);
}
