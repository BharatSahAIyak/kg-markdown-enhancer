"use client"
import Markdown from "react-markdown";
import { useState } from "react";

export default function Page() {
    const [markdown, setMarkdown] = useState("# Write your Markdown here");

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-black h-80 p-2">
                <textarea
                    value={markdown}
                    className="w-full h-full p-2 text-xl"
                    onChange={(e) => setMarkdown(e.target.value)}
                />
            </div>

            <div className="border-2 border-black h-auto p-2 overflow-y-scroll">
                <Markdown>{markdown}</Markdown>
            </div>
        </div>
    );
}
