'use client';
import Markdown from "react-markdown"
import { useState } from "react";
const page = () => {
    const [markdown, setMarkdown] = useState("I am Mohit Saini")
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-black h-80 p-2">
                <textarea value={markdown} className=" w-full p-2 text-xl" onChange={(e) => setMarkdown(e.target.value)} />
            </div>

            <div className="border-2 border-black h-[42rem] p-2 overflow-y-scroll">
                <Markdown>{markdown}</Markdown>
            </div>
        </div>

    )
}

export default page