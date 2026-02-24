# Huffman Coding Visualizer

A visually impressive, interactive tool for understanding the **Huffman Coding** algorithm—one of the most famous methods for lossless data compression.

## 🚀 How to Run

1.  **Directly**: Open [index.html](index.html) in any modern web browser.
2.  **Using Terminal (Windows)**:
    ```bash
    start index.html
    ```
3.  **Local Server**:
    ```bash
    npx serve .
    ```

## 🧠 How Huffman Coding Works

Huffman coding is a greedy algorithm that assigns variable-length codes to input characters. Characters that appear more frequently are assigned shorter binary codes, while less frequent characters get longer codes. This results in an overall reduction in the total number of bits required to store the data.

### The Process:

1.  **Frequency Analysis**: The tool calculates how many times each character appears in your text.
2.  **Priority Queue**: Each character is treated as a leaf node and added to a priority queue (sorted by frequency).
3.  **Tree Construction**:
    - The two nodes with the lowest frequencies are removed from the queue.
    - A new internal node is created with these two as children.
    - The internal node's frequency is the sum of its children's frequencies.
    - This new node is placed back into the queue.
    - This repeats until only one node (the **Root**) remains—this is the **Huffman Tree**.
4.  **Code Generation**:
    - Starting from the root, assign `0` for every left branch and `1` for every right branch.
    - The path from the root to each character leaf determines its unique binary code.

## 🛠️ Built With

- **HTML5**: Semantic structure.
- **Vanilla CSS**: Modern dark theme and responsive layout.
- **Vanilla JavaScript**: Core Huffman logic and state management.
- **D3.js**: High-performance SVG tree visualization and animations.

## 📈 Improvement Ideas

- **Step-by-Step Step Mode**: A "Next Step" button to manually advance the tree merging process.
- **Import/Export**: Load text files directly or export the compressed binary stream.
- **Interactive Highlighting**: Hover over a code to see where that character appears in the original text.

---
*Created as a portfolio-ready educational tool.*
