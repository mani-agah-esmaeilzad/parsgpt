"use client";

import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { UiGpt } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface GptCardProps {
    gpt: UiGpt;
}

export function GptCard({ gpt }: GptCardProps) {
    return (
        <Card className="group flex h-full flex-col overflow-hidden border-muted transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="mb-2 h-10 w-10 text-3xl">
                    {gpt.icon ?? "🤖"}
                </div>
                <CardTitle className="line-clamp-1 text-lg group-hover:text-primary transition-colors">
                    {gpt.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                    {gpt.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {/* Tags or Starter Prompts */}
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    {gpt.tags?.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="px-2 py-0.5 font-normal">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex items-center gap-2 border-t bg-muted/20 p-3">
                <Button asChild size="sm" className="flex-1 gap-2" variant="default">
                    <Link href={`/chat?gptId=${gpt.id}`}>
                        <MessageSquare className="h-4 w-4" />
                        شروع گفتگو
                    </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="px-2">
                    <Link href={`/gpt/${gpt.slug}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
