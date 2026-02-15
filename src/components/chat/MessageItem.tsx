"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, User, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UiMessage } from "@/types/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageItemProps {
    message: UiMessage;
    isStreaming?: boolean;
}

export function MessageItem({ message, isStreaming }: MessageItemProps) {
    const isUser = message.role === "user";

    return (
        <div className="group w-full text-gray-800 dark:text-gray-100">
            <div className={cn("mx-auto flex w-full max-w-4xl px-4 py-4", isUser ? "justify-end" : "justify-start")}>
                <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
                    <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8">
                            {isUser ? (
                                <AvatarFallback className="bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-white">
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            ) : (
                                <AvatarFallback className="bg-emerald-500 text-white">
                                    <svg width="24" height="24" viewBox="0 0 41 41" fill="none" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg"><path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3936 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.50019C16.1708 0.495044 14.0626 1.11602 12.2386 2.28638C10.4146 3.45674 8.95529 5.12657 8.04248 7.08746C6.84097 7.53766 5.717 8.21007 4.74669 9.06048C3.77638 9.91089 2.98223 10.9196 2.41804 12.0199C0.903828 14.9493 0.903828 18.2575 2.41804 21.1869C3.13693 22.5855 4.14811 23.7915 5.38532 24.7268C5.22709 25.9657 5.3377 27.2285 5.70959 28.4239C6.27315 30.1558 7.37346 31.6706 8.87532 32.7844C10.3772 33.8982 12.2155 34.5619 14.1627 34.6946C15.1189 35.7483 16.2735 36.5891 17.5641 37.1627C18.8548 37.7363 20.2505 38.0298 21.6644 38.0242C24.478 38.0312 27.2203 37.0395 29.3514 35.2045C30.6874 34.0531 31.6934 32.5835 32.285 30.9168C33.4735 30.4682 34.5888 29.8003 35.5562 28.9575C36.5236 28.1147 37.3204 27.1166 37.8931 26.0289C39.4206 23.0888 39.4206 19.7618 37.8931 16.8217H37.5324Z" fill="#currentColor"></path></svg>
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </div>

                    <div
                        className={cn(
                            "min-w-0 max-w-[680px] rounded-2xl border px-4 py-3 text-sm leading-7 shadow-sm",
                            isUser
                                ? "border-black/5 bg-black text-white dark:border-white/10 dark:bg-white dark:text-black"
                                : "border-black/5 bg-white/80 text-neutral-800 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        )}
                    >
                        <div className="mb-1 text-xs font-semibold opacity-70">{isUser ? "شما" : "ParsGPT"}</div>
                        <div className={cn("prose prose-slate dark:prose-invert max-w-none break-words text-sm", isUser && "whitespace-pre-wrap")}>
                            {isUser ? (
                                message.content
                            ) : (
                                <MarkdownContent content={message.content} />
                            )}
                            {isStreaming && (
                                <span className="inline-block w-2 h-4 bg-current align-middle animate-pulse ml-1" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const markdownComponents: Components = {
    code({ inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "");
        if (inline) {
            return (
                <code dir="ltr" className="rounded bg-muted px-1 py-0.5 font-mono text-sm" {...props}>
                    {children}
                </code>
            );
        }
        const language = match?.[1] ?? "text";
        return <CodeBlock language={language} value={String(children).replace(/\n$/, "")} />;
    },
    p: ({ children }) => <p dir="rtl">{children}</p>,
    li: ({ children }) => <li dir="rtl">{children}</li>,
    ul: ({ children }) => (
        <ul dir="rtl" className="list-disc pr-4 my-2">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol dir="rtl" className="list-decimal pr-4 my-2">
            {children}
        </ol>
    ),
};

function MarkdownContent({ content }: { content: string }) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
        </ReactMarkdown>
    );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("کپی شد");
        } catch {
            toast.error("خطا");
        }
    };

    return (
        <div className="relative my-4 overflow-hidden rounded-md border bg-zinc-950 text-gray-100" dir="ltr">
            <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-2 text-xs text-gray-200">
                <span>{language}</span>
                <button onClick={handleCopy} className="flex items-center gap-1 hover:text-white">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "کپی شد" : "کپی"}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
                    codeTagProps={{ style: { fontFamily: 'inherit' } }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div >
    );
}
