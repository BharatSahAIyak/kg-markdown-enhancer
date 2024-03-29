'use client'
import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { marked } from "marked";

const Page = () => {
  const defaultMarkdown = `
Marked - Markdown Parser
========================

[Marked] lets you convert [Markdown] into HTML.  Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML.  This demo page will let you type anything you like and see how it gets converted.  Live.  No more waiting around.

How To Use The Demo
-------------------

1. Type in stuff on the left.
2. See the live updates on the right.

That's it.  Pretty simple.  There's also a drop-down option above to switch between various views:

- **Preview:**  A live display of the generated HTML as it would render in a browser.
- **HTML Source:**  The generated HTML before your browser makes it pretty.
- **Lexer Data:**  What [marked] uses internally, in case you like gory stuff like this.
- **Quick Reference:**  A brief run-down of how to format things using markdown.

*Why Markdown?*
-------------

It's easy.  It's not overly bloated, unlike HTML.  Also, as the creator of [markdown] says,

- > The overriding design goal for Markdown's
- > formatting syntax is to make it as readable
- > as possible. The idea is that a
- > Markdown-formatted document should be
- > publishable as-is, as plain text, without
- > looking like it's been marked up with tags
- > or formatting instructions.

Ready to start writing?  Either start changing stuff on the left or
[clear everything](/demo/?text=) with a simple click.

`;

  const database = ["Markdown", "Marked", "HTML"];

  const [markdown, setMarkdown] = useState(defaultMarkdown);

  const highlightWords = (text) => {
    return text.replace(/\b(\w+)\b/g, (word) => {
      if (database.includes(word)) {
        return `<button onclick="window.neo4jIntegration('${word}')" style="background-color: yellow; cursor:pointer">${word}</button>`;
      } else {
        return word;
      }
    });
  };

  const html = marked.parse(markdown);
  const highlightedHtml = highlightWords(html);

  useEffect(() => {
    window.neo4jIntegration = (word) => {
      console.log(`Clicked word: ${word}`);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border-2 border-black h-full p-2">
        <textarea
          value={markdown}
          className=" w-full h-full p-2 text-xl"
          onChange={(e) => setMarkdown(e.target.value)}
        />
      </div>

      <div
        className="border-2 border-black h-[42rem] p-2 overflow-y-scroll"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  );
};

export default Page;
