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
        <div
            className={cn(
                "group w-full border-b border-black/5 dark:border-white/5 text-gray-800 dark:text-gray-100",
                isUser ? "bg-background/50" : "bg-transparent"
            )}
        >
            <div className="text-base gap-4 md:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] mx-auto p-4 flex flex-row">
                {/* Avatar Area */}
                <div className="flex-shrink-0 flex flex-col relative items-end">
                    <Avatar className="h-8 w-8">
                        {isUser ? (
                            <AvatarFallback className="bg-muted-foreground/20">
                                <User className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                        ) : (
                            <AvatarFallback className="bg-emerald-500 text-white">
                                {/* OpenAI logo or Bot icon */}
                                <svg width="24" height="24" viewBox="0 0 41 41" fill="none" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg"><path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3936 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.50019C16.1708 0.495044 14.0626 1.11602 12.2386 2.28638C10.4146 3.45674 8.95529 5.12657 8.04248 7.08746C6.84097 7.53766 5.717 8.21007 4.74669 9.06048C3.77638 9.91089 2.98223 10.9196 2.41804 12.0199C0.903828 14.9493 0.903828 18.2575 2.41804 21.1869C3.13693 22.5855 4.14811 23.7915 5.38532 24.7268C5.22709 25.9657 5.3377 27.2285 5.70959 28.4239C6.27315 30.1558 7.37346 31.6706 8.87532 32.7844C10.3772 33.8982 12.2155 34.5619 14.1627 34.6946C15.1189 35.7483 16.2735 36.5891 17.5641 37.1627C18.8548 37.7363 20.2505 38.0298 21.6644 38.0242C24.478 38.0312 27.2203 37.0395 29.3514 35.2045C30.6874 34.0531 31.6934 32.5835 32.285 30.9168C33.4735 30.4682 34.5888 29.8003 35.5562 28.9575C36.5236 28.1147 37.3204 27.1166 37.8931 26.0289C39.4206 23.0888 39.4206 19.7618 37.8931 16.8217H37.5324ZM15.4674 9.1661C15.4674 8.44199 15.6883 7.73351 16.1039 7.12487C16.5195 6.51623 17.1119 6.033 17.811 5.73278C18.51 5.43255 19.2859 5.32766 20.047 5.43098C20.8081 5.53429 21.5226 5.84151 22.1054 6.31599L32.1154 14.3642C32.4093 14.6006 32.6186 14.9254 32.7161 15.2929C32.8136 15.6603 32.7947 16.052 32.6619 16.4137L28.1724 28.5306C27.9044 29.2559 27.382 29.8659 26.7027 30.2458C26.0234 30.6258 25.2343 30.7492 24.4831 30.5931L16.2995 28.892C15.6558 28.7562 15.1102 28.3243 14.7766 27.7656C14.4431 27.2069 14.3468 26.5418 14.5079 25.9103L15.394 22.4277L13.1415 22.4277C12.3857 22.4277 11.6457 22.2152 10.999 21.8126C10.3524 21.41 9.82313 20.8322 9.467 20.1402C9.11088 19.4482 9.03517 18.6695 9.24835 17.9252C9.46152 17.1809 9.95408 16.5028 10.6698 15.964L15.4674 12.3556V9.1661Z" fill="#currentColor"></path></svg>
                            </AvatarFallback>
                        )}
                    </Avatar>
                </div>

                {/* Content Area */}
                <div className="relative flex-1 overflow-hidden min-w-0">
                    <div className="font-semibold text-sm mb-1 opacity-90 select-none">
                        {isUser ? "شما" : "ParsGPT"}
                    </div>
                    <div className={cn("prose prose-slate dark:prose-invert max-w-none break-words text-sm leading-7", isUser && "whitespace-pre-wrap")}>
                        {isUser ? (
                            message.content
                        ) : (
                            <MarkdownContent content={message.content} />
                        )}
                        {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-foreground align-middle animate-pulse ml-1" />
                        )}
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
            <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-2 text-xs text-gray-400">
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
