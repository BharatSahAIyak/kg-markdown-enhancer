function enrichMarkdown() {
    const markdownInput = document.getElementById('markdown-input').value;
    const enrichedMarkdown = document.getElementById('enriched-markdown');
    
    // For now, let's just display the original Markdown content as enriched Markdown
    enrichedMarkdown.innerHTML = markdownInput;
}
